import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { guardarSesionDePrueba, sesionDePrueba } from '../../../testing/sesion-de-prueba';
import { proveerClienteApi } from '../api/api.providers';
import { LoginResponseDto } from '../api/modelos';
import { MANEJA_401_PROPIO } from '../errores/contexto-errores';
import { CLAVE_SESION } from './sesion-almacen';
import { SesionService } from './sesion.service';

/** Respuesta de login de ejemplo. */
function respuestaLogin(expiraEn: string): LoginResponseDto {
  return {
    token: 'token-de-prueba',
    tipo: 'Bearer',
    expiraEn,
    usuarioId: '00000000-0000-4000-8000-000000000002',
    nombre: 'Elena Paz',
    rol: 'LABORATORIO',
    empresaId: '00000000-0000-4000-8000-0000000000e1',
    esAdminEmpresa: true,
    esDirectorTecnico: true,
  };
}

describe('SesionService', () => {
  let http: HttpTestingController;
  /** Espía de Router.navigate (no navega de verdad). */
  let navegar: Router['navigate'];

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), proveerClienteApi()],
    });
    http = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    navegar = router.navigate;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('iniciarSesion: con credenciales correctas activa y guarda la sesión', async () => {
    const servicio = TestBed.inject(SesionService);

    const promesa = servicio.iniciarSesion({ email: 'admin@laboratorio-andino.demo', password: 'clave-de-prueba' });
    const pedido = http.expectOne('/api/auth/login');
    expect(pedido.request.method).toBe('POST');
    expect(pedido.request.body).toEqual({ email: 'admin@laboratorio-andino.demo', password: 'clave-de-prueba' });
    // El login maneja su propio 401 (credenciales inválidas en el formulario).
    expect(pedido.request.context.get(MANEJA_401_PROPIO)).toBe(true);
    pedido.flush(respuestaLogin('2099-01-01T00:00:00Z'));
    const resultado = await promesa;

    expect(resultado.ok).toBe(true);
    expect(servicio.autenticado()).toBe(true);
    expect(servicio.sesion()?.rol).toBe('LABORATORIO');
    expect(servicio.sesion()?.esDirectorTecnico).toBe(true);
    expect(servicio.sesion()?.provincia).toBeNull();
    expect(sessionStorage.getItem(CLAVE_SESION)).not.toBeNull();
    http.verify();
  });

  it('iniciarSesion: un 401 vuelve como error para el formulario y no activa nada', async () => {
    const servicio = TestBed.inject(SesionService);

    const promesa = servicio.iniciarSesion({ email: 'alguien@ejemplo.com', password: 'mal' });
    http
      .expectOne('/api/auth/login')
      .flush(
        { status: 401, message: 'Email o contraseña incorrectos', regla: null, errors: null },
        { status: 401, statusText: 'Unauthorized' },
      );
    const resultado = await promesa;

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error.status).toBe(401);
      expect(resultado.error.mensaje).toBe('Email o contraseña incorrectos');
    }
    expect(servicio.sesion()).toBeNull();
    expect(sessionStorage.getItem(CLAVE_SESION)).toBeNull();
    expect(navegar).not.toHaveBeenCalled();
    http.verify();
  });

  it('restaurar: recupera una sesión guardada vigente', () => {
    const sesion = sesionDePrueba({ rol: 'FARMACIA', empresaId: 'e2' });
    guardarSesionDePrueba(sesion);
    const servicio = TestBed.inject(SesionService);

    servicio.restaurar();

    expect(servicio.sesion()).toEqual(sesion);
  });

  it('restaurar: borra una sesión guardada vencida', () => {
    guardarSesionDePrueba(sesionDePrueba({ expiraEn: '2020-01-01T00:00:00Z' }));
    const servicio = TestBed.inject(SesionService);

    servicio.restaurar();

    expect(servicio.sesion()).toBeNull();
    expect(sessionStorage.getItem(CLAVE_SESION)).toBeNull();
  });

  it('restaurar: borra lo guardado si no es una sesión válida', () => {
    sessionStorage.setItem(CLAVE_SESION, '{"token":"x"}');
    const servicio = TestBed.inject(SesionService);

    servicio.restaurar();

    expect(servicio.sesion()).toBeNull();
    expect(sessionStorage.getItem(CLAVE_SESION)).toBeNull();
  });

  it('al llegar a expiraEn la sesión termina sola y lleva a ingresar con motivo "vencida"', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-12T12:00:00Z'));
    guardarSesionDePrueba(sesionDePrueba({ expiraEn: '2026-10-12T20:00:00Z' }));
    const servicio = TestBed.inject(SesionService);
    servicio.restaurar();

    vi.advanceTimersByTime(8 * 60 * 60 * 1000 - 1);
    expect(servicio.sesion()).not.toBeNull();

    vi.advanceTimersByTime(1);
    expect(servicio.sesion()).toBeNull();
    expect(sessionStorage.getItem(CLAVE_SESION)).toBeNull();
    expect(navegar).toHaveBeenCalledWith(['/ingresar'], { queryParams: { motivo: 'vencida', volver: '/' } });
  });

  it('finalizarSesion("salida") lleva a ingresar sin motivo', () => {
    guardarSesionDePrueba(sesionDePrueba());
    const servicio = TestBed.inject(SesionService);
    servicio.restaurar();

    servicio.finalizarSesion('salida');

    expect(servicio.sesion()).toBeNull();
    expect(navegar).toHaveBeenCalledWith(['/ingresar'], { queryParams: {} });
  });

  it('finalizarSesion estando ya en ingresar no vuelve a navegar (varios 401 a la vez)', () => {
    vi.spyOn(TestBed.inject(Router), 'url', 'get').mockReturnValue('/ingresar?motivo=rechazada');
    const servicio = TestBed.inject(SesionService);

    servicio.finalizarSesion('rechazada');

    expect(navegar).not.toHaveBeenCalled();
  });
});
