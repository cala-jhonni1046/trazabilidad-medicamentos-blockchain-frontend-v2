import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { SesionService } from '../auth/sesion.service';
import { AvisosService } from './avisos.service';
import { MANEJA_401_PROPIO } from './contexto-errores';
import { ErrorApi, parsearErrorApi } from './error-api';

/**
 * Convierte cada error HTTP en un {@link ErrorApi} y resuelve lo global:
 *
 * | Caso                 | Qué hace                                                   |
 * |----------------------|------------------------------------------------------------|
 * | sin conexión         | aviso global                                               |
 * | 401                  | cierra la sesión y lleva a ingresar (salvo MANEJA_401_PROPIO) |
 * | 403                  | aviso global con el mensaje de la API                      |
 * | 5xx (menos 503)      | aviso global con el mensaje de la API                      |
 * | 400, 404, 409, 503   | nada global: la pantalla los muestra junto a la acción     |
 *
 * Siempre relanza el ErrorApi, para que el Resultado o el recurso de la pantalla lo reciba.
 * Un error que no es HTTP (un bug) pasa sin tocar.
 */
export const erroresInterceptor: HttpInterceptorFn = (pedido, siguiente) => {
  const sesion = inject(SesionService);
  const avisos = inject(AvisosService);
  return siguiente(pedido).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }
      const errorApi = parsearErrorApi(error);
      aplicarEfectosGlobales(errorApi, pedido, sesion, avisos);
      return throwError(() => errorApi);
    }),
  );
};

/** Efectos que no dependen de la pantalla (ver la tabla de erroresInterceptor). */
function aplicarEfectosGlobales(
  error: ErrorApi,
  pedido: HttpRequest<unknown>,
  sesion: SesionService,
  avisos: AvisosService,
): void {
  if (error.sinConexion) {
    avisos.mostrarError(error.mensaje);
    return;
  }
  if (error.status === 401) {
    if (!pedido.context.get(MANEJA_401_PROPIO)) {
      sesion.finalizarSesion('rechazada');
    }
    return;
  }
  if (error.status === 403) {
    avisos.mostrarError(error.mensaje);
    return;
  }
  if (error.status >= 500 && error.status !== 503) {
    avisos.mostrarError(error.mensaje);
  }
}
