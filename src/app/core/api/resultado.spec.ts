import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ErrorApi } from '../errores/error-api';
import { aResultado } from './resultado';

describe('aResultado', () => {
  it('respuesta correcta → { ok: true, valor }', async () => {
    const resultado = await aResultado(of({ codigo: 'L2026-0001' }));

    expect(resultado).toEqual({ ok: true, valor: { codigo: 'L2026-0001' } });
  });

  it('HttpErrorResponse → { ok: false, error } con el ErrorApi interpretado', async () => {
    const respuesta = new HttpErrorResponse({
      status: 409,
      error: { status: 409, message: 'El lote está vencido', regla: 'R10', errors: null },
    });

    const resultado = await aResultado(throwError(() => respuesta));

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error).toBeInstanceOf(ErrorApi);
      expect(resultado.error.regla).toBe('R10');
      expect(resultado.error.mensaje).toBe('El lote está vencido');
    }
  });

  it('ErrorApi ya interpretado (como lo relanza el interceptor) → la misma instancia', async () => {
    const errorApi = new ErrorApi(404, 'Lote no encontrado', null, []);

    const resultado = await aResultado(throwError(() => errorApi));

    expect(resultado).toEqual({ ok: false, error: errorApi });
    if (!resultado.ok) {
      expect(resultado.error).toBe(errorApi);
    }
  });

  it('un error que no es de la API (un bug) se propaga, no se oculta como Resultado', async () => {
    const bug = new TypeError('Cannot read properties of undefined');

    await expect(aResultado(throwError(() => bug))).rejects.toBe(bug);
  });
});
