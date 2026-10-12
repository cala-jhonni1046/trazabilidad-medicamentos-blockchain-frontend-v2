import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { RAIZ_API } from '../api/api.providers';
import { iniciarSesion } from '../api/generado/fn/autenticacion/iniciar-sesion';
import { ErrorApi } from '../errores/error-api';
import { SesionService } from './sesion.service';

/** Prefijo de las URLs de nuestra API (relativas: mismo origen que el frontend). */
const PREFIJO_API = `${RAIZ_API}/api/`;

/** URL del login: nunca lleva token. */
const URL_LOGIN = `${RAIZ_API}${iniciarSesion.PATH}`;

/** Mensaje cuando un pedido sale con la sesión ya vencida. */
export const MENSAJE_SESION_VENCIDA = 'Tu sesión venció. Ingresá de nuevo.';

/**
 * Agrega `Authorization: Bearer <token>` a los pedidos a nuestra API.
 *
 * - Solo a URLs relativas `/api/...`: el token nunca sale hacia otro sitio.
 * - Nunca al login.
 * - Si la sesión ya venció, no envía el pedido: cierra la sesión y responde un ErrorApi 401.
 */
export const authInterceptor: HttpInterceptorFn = (pedido, siguiente) => {
  if (!pedido.url.startsWith(PREFIJO_API) || pedido.url === URL_LOGIN) {
    return siguiente(pedido);
  }
  const sesionService = inject(SesionService);
  const sesion = sesionService.sesion();
  if (sesion === null) {
    return siguiente(pedido);
  }
  if (sesionService.estaVencida()) {
    sesionService.finalizarSesion('vencida');
    return throwError(() => new ErrorApi(401, MENSAJE_SESION_VENCIDA, null, []));
  }
  return siguiente(pedido.clone({ setHeaders: { Authorization: `Bearer ${sesion.token}` } }));
};
