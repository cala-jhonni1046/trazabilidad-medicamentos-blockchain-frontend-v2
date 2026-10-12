import { HttpErrorResponse } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { ErrorApi, parsearErrorApi } from '../errores/error-api';

/**
 * Resultado de una acción contra la API: el valor devuelto, o el error ya interpretado.
 * Las acciones de los servicios de datos devuelven `Promise<Resultado<T>>`, así la
 * pantalla decide qué mostrar sin try/catch.
 */
export type Resultado<T> =
  | { readonly ok: true; readonly valor: T }
  | { readonly ok: false; readonly error: ErrorApi };

/**
 * Ejecuta una llamada a la API (un Observable que emite una vez) y la convierte en
 * {@link Resultado}.
 *
 * Solo atrapa errores de la API: un `ErrorApi` (ya interpretado por el interceptor) o
 * un `HttpErrorResponse` (sin interceptor, por ejemplo en tests). Cualquier otro error
 * es un bug del frontend y se propaga, para no ocultarlo como un error de la API.
 */
export async function aResultado<T>(llamada: Observable<T>): Promise<Resultado<T>> {
  try {
    const valor = await firstValueFrom(llamada);
    return { ok: true, valor };
  } catch (error: unknown) {
    if (error instanceof ErrorApi) {
      return { ok: false, error };
    }
    if (error instanceof HttpErrorResponse) {
      return { ok: false, error: parsearErrorApi(error) };
    }
    throw error;
  }
}
