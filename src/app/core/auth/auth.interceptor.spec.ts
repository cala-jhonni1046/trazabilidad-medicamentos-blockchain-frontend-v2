import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { guardarSesionDePrueba, sesionDePrueba } from '../../../testing/sesion-de-prueba';
import { proveerClienteApi } from '../api/api.providers';
import { ErrorApi } from '../errores/error-api';
import { MENSAJE_SESION_VENCIDA, authInterceptor } from './auth.interceptor';
import { SesionService } from './sesion.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  /** Configura HttpClient con el interceptor y, si se pide, una sesión activa. */
  function configurar(conSesion: boolean): void {
    if (conSesion) {
      guardarSesionDePrueba(sesionDePrueba({ expiraEn: '2026-10-12T20:00:00Z' }));
    }
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        proveerClienteApi(),
      ],
    });
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    TestBed.inject(SesionService).restaurar();
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  }

  beforeEach(() => {
    sessionStorage.clear();
    // Reloj fijo: la sesión de prueba vence a las 20:00 UTC. Solo se simula Date (no los temporizadores).
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-12T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('con sesión, agrega el token a los pedidos a /api/...', () => {
    configurar(true);

    http.get('/api/lotes').subscribe();

    expect(backend.expectOne('/api/lotes').request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
    backend.verify();
  });

  it('nunca agrega el token al login', () => {
    configurar(true);

    http.post('/api/auth/login', {}).subscribe();

    expect(backend.expectOne('/api/auth/login').request.headers.has('Authorization')).toBe(false);
    backend.verify();
  });

  it('nunca agrega el token a una dirección de otro sitio', () => {
    configurar(true);

    http.get('https://sepolia.etherscan.io/tx/0x01').subscribe();

    expect(backend.expectOne('https://sepolia.etherscan.io/tx/0x01').request.headers.has('Authorization')).toBe(
      false,
    );
    backend.verify();
  });

  it('sin sesión, el pedido sale sin token', () => {
    configurar(false);

    http.get('/api/verificacion').subscribe();

    expect(backend.expectOne('/api/verificacion').request.headers.has('Authorization')).toBe(false);
    backend.verify();
  });

  it('con la sesión vencida no envía el pedido: cierra la sesión y responde un 401', async () => {
    configurar(true);
    vi.setSystemTime(new Date('2026-10-12T20:00:01Z'));

    const error: unknown = await firstValueFrom(http.get('/api/lotes')).catch((e: unknown) => e);

    backend.expectNone('/api/lotes');
    expect(error).toBeInstanceOf(ErrorApi);
    expect((error as ErrorApi).status).toBe(401);
    expect((error as ErrorApi).mensaje).toBe(MENSAJE_SESION_VENCIDA);
    expect(TestBed.inject(SesionService).sesion()).toBeNull();
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/ingresar'], {
      queryParams: { motivo: 'vencida', volver: '/' },
    });
  });
});
