import { HttpErrorResponse } from '@angular/common/http';
import { ErrorApi, MENSAJE_ERROR_DEL_SERVIDOR, MENSAJE_SIN_CONEXION, parsearErrorApi } from './error-api';

/** Arma una respuesta de error como la que entrega HttpClient. */
function respuestaDeError(status: number, cuerpo: unknown): HttpErrorResponse {
  return new HttpErrorResponse({ status, error: cuerpo, url: '/api/prueba' });
}

describe('parsearErrorApi', () => {
  it('409: toma el código de la regla y el mensaje del backend tal cual', () => {
    const error = parsearErrorApi(
      respuestaDeError(409, {
        status: 409,
        message: 'La caja ya fue dispensada',
        regla: 'R11',
        errors: null,
      }),
    );

    expect(error.status).toBe(409);
    expect(error.mensaje).toBe('La caja ya fue dispensada');
    expect(error.regla).toBe('R11');
    expect(error.campos).toEqual([]);
    expect(error.sinConexion).toBe(false);
  });

  it('400 de validación: conserva los errores por campo (respuesta real del backend)', () => {
    const error = parsearErrorApi(
      respuestaDeError(400, {
        errors: [
          {
            field: 'verificar.gtin',
            message: 'El GTIN no es válido: debe tener 14 dígitos con dígito verificador GS1 correcto',
          },
        ],
        message: 'Error de validación',
        regla: null,
        status: 400,
      }),
    );

    expect(error.mensaje).toBe('Error de validación');
    expect(error.regla).toBeNull();
    expect(error.campos).toEqual([
      {
        field: 'verificar.gtin',
        message: 'El GTIN no es válido: debe tener 14 dígitos con dígito verificador GS1 correcto',
      },
    ]);
  });

  it('401: regla null, porque solo el 409 trae código', () => {
    const error = parsearErrorApi(
      respuestaDeError(401, {
        errors: null,
        message: 'No autenticado: falta el token o no es válido',
        regla: null,
        status: 401,
      }),
    );

    expect(error.status).toBe(401);
    expect(error.mensaje).toBe('No autenticado: falta el token o no es válido');
    expect(error.regla).toBeNull();
  });

  it('503 con ErrorResponseDTO: usa el mensaje del backend, no el de sin conexión', () => {
    const error = parsearErrorApi(
      respuestaDeError(503, { status: 503, message: 'La red Sepolia no responde', regla: null, errors: null }),
    );

    expect(error.mensaje).toBe('La red Sepolia no responde');
    expect(error.sinConexion).toBe(false);
  });

  it('acepta un ErrorResponseDTO que llega como texto JSON', () => {
    const error = parsearErrorApi(
      respuestaDeError(409, '{"status":409,"message":"Lote duplicado","regla":"LOTE_DUPLICADO","errors":null}'),
    );

    expect(error.mensaje).toBe('Lote duplicado');
    expect(error.regla).toBe('LOTE_DUPLICADO');
  });

  it('status 0 (el navegador no obtuvo respuesta): mensaje de sin conexión', () => {
    const error = parsearErrorApi(respuestaDeError(0, new ProgressEvent('error')));

    expect(error.status).toBe(0);
    expect(error.mensaje).toBe(MENSAJE_SIN_CONEXION);
    expect(error.regla).toBeNull();
    expect(error.sinConexion).toBe(true);
  });

  it.each([502, 504])('%i sin ErrorResponseDTO (proxy sin backend): mensaje de sin conexión', (status) => {
    // Con el backend apagado, el proxy de ng serve responde 502 con el cuerpo vacío.
    const error = parsearErrorApi(respuestaDeError(status, ''));

    expect(error.mensaje).toBe(MENSAJE_SIN_CONEXION);
    expect(error.sinConexion).toBe(true);
  });

  it('500 sin ErrorResponseDTO: mensaje genérico de error del servidor', () => {
    const error = parsearErrorApi(respuestaDeError(500, '<html>Internal Server Error</html>'));

    expect(error.mensaje).toBe(MENSAJE_ERROR_DEL_SERVIDOR);
    expect(error.sinConexion).toBe(false);
  });

  it('4xx con un cuerpo que no es ErrorResponseDTO: mensaje genérico con el status', () => {
    const error = parsearErrorApi(respuestaDeError(404, { otraCosa: true }));

    expect(error.status).toBe(404);
    expect(error.mensaje).toBe('No se pudo completar la operación (error 404).');
    expect(error.campos).toEqual([]);
  });

  it('cuerpo Blob (descarga de un PDF): no se lee, mensaje genérico', () => {
    const cuerpo = new Blob(['{"status":404,"message":"No encontrado"}'], { type: 'application/json' });

    const error = parsearErrorApi(respuestaDeError(404, cuerpo));

    expect(error.mensaje).toBe('No se pudo completar la operación (error 404).');
  });

  it('el ErrorApi es un Error, con message igual al mensaje', () => {
    const error = parsearErrorApi(
      respuestaDeError(409, { status: 409, message: 'Transición inválida', regla: 'TRANSICION_INVALIDA', errors: null }),
    );

    expect(error).toBeInstanceOf(ErrorApi);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Transición inválida');
  });
});
