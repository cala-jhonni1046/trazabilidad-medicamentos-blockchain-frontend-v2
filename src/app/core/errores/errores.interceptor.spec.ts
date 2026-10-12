import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { SesionService } from '../auth/sesion.service';
import { AvisosService } from './avisos.service';
import { MANEJA_401_PROPIO } from './contexto-errores';
import { ErrorApi, MENSAJE_ERROR_DEL_SERVIDOR, MENSAJE_SIN_CONEXION } from './error-api';
import { erroresInterceptor } from './errores.interceptor';

describe('erroresInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  const avisos = { mostrarError: vi.fn() };
  const sesion = { finalizarSesion: vi.fn() };

  beforeEach(() => {
    avisos.mostrarError.mockReset();
    sesion.finalizarSesion.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([erroresInterceptor])),
        provideHttpClientTesting(),
        { provide: AvisosService, useValue: avisos },
        { provide: SesionService, useValue: sesion },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  /** Hace un GET, lo responde con el status y cuerpo dados y devuelve el error que llegó. */
  async function fallarCon(status: number, cuerpo: string | object, contexto?: HttpContext): Promise<unknown> {
    const promesa = firstValueFrom(http.get('/api/prueba', { context: contexto })).catch((e: unknown) => e);
    backend.expectOne('/api/prueba').flush(cuerpo, { status, statusText: 'Error' });
    return promesa;
  }

  /** Cuerpo ErrorResponseDTO de ejemplo. */
  function errorDto(status: number, message: string, regla: string | null = null): object {
    return { status, message, regla, errors: null };
  }

  it('409: relanza un ErrorApi con la regla y no muestra nada global', async () => {
    const error = await fallarCon(409, errorDto(409, 'La caja ya fue dispensada', 'R11'));

    expect(error).toBeInstanceOf(ErrorApi);
    expect((error as ErrorApi).regla).toBe('R11');
    expect(avisos.mostrarError).not.toHaveBeenCalled();
    expect(sesion.finalizarSesion).not.toHaveBeenCalled();
  });

  it.each([400, 404])('%i: nada global (lo muestra la pantalla)', async (status) => {
    const error = await fallarCon(status, errorDto(status, 'Detalle de la API'));

    expect((error as ErrorApi).mensaje).toBe('Detalle de la API');
    expect(avisos.mostrarError).not.toHaveBeenCalled();
  });

  it('503 con ErrorResponseDTO: nada global (es de "Anclar ya", va en la pantalla)', async () => {
    await fallarCon(503, errorDto(503, 'La red Sepolia no responde'));

    expect(avisos.mostrarError).not.toHaveBeenCalled();
  });

  it('401: cierra la sesión con motivo "rechazada"', async () => {
    const error = await fallarCon(401, errorDto(401, 'No autenticado: falta el token o no es válido'));

    expect((error as ErrorApi).status).toBe(401);
    expect(sesion.finalizarSesion).toHaveBeenCalledWith('rechazada');
    expect(avisos.mostrarError).not.toHaveBeenCalled();
  });

  it('401 de un pedido que lo maneja él mismo (login): no cierra nada', async () => {
    await fallarCon(401, errorDto(401, 'Email o contraseña incorrectos'), new HttpContext().set(MANEJA_401_PROPIO, true));

    expect(sesion.finalizarSesion).not.toHaveBeenCalled();
  });

  it('403: aviso global con el mensaje de la API', async () => {
    await fallarCon(403, errorDto(403, 'Acceso denegado para tu rol'));

    expect(avisos.mostrarError).toHaveBeenCalledWith('Acceso denegado para tu rol');
    expect(sesion.finalizarSesion).not.toHaveBeenCalled();
  });

  it('500: aviso global', async () => {
    await fallarCon(500, '<html>Internal Server Error</html>');

    expect(avisos.mostrarError).toHaveBeenCalledWith(MENSAJE_ERROR_DEL_SERVIDOR);
  });

  it('502 del proxy (backend apagado): aviso de sin conexión', async () => {
    await fallarCon(502, '');

    expect(avisos.mostrarError).toHaveBeenCalledWith(MENSAJE_SIN_CONEXION);
  });

  it('sin respuesta del navegador (status 0): aviso de sin conexión', async () => {
    const promesa = firstValueFrom(http.get('/api/prueba')).catch((e: unknown) => e);
    backend.expectOne('/api/prueba').error(new ProgressEvent('error'));
    const error = await promesa;

    expect((error as ErrorApi).sinConexion).toBe(true);
    expect(avisos.mostrarError).toHaveBeenCalledWith(MENSAJE_SIN_CONEXION);
  });
});
