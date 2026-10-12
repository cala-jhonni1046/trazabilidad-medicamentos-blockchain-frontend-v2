import { inject } from '@angular/core';
import { CanMatchFn, RedirectFunction, Router, UrlSegment, UrlTree } from '@angular/router';
import { RolUsuario } from '../api/modelos';
import { RUTA_INGRESAR, RUTA_INICIO_POR_ROL } from './rutas-sesion';
import { SesionService } from './sesion.service';

// Los guards ordenan la navegación (comodidad): los permisos los decide la API.
// Son canMatch: si no corresponde, ni siquiera se descarga el código de la ruta.

/** Deja pasar a cualquiera con sesión; sin sesión, lleva a ingresar (y después vuelve). */
export const sesionGuard: CanMatchFn = (_ruta, segmentos) => {
  return inject(SesionService).sesion() !== null ? true : urlIngresar(segmentos);
};

/**
 * Deja pasar solo a los roles indicados. Sin sesión, lleva a ingresar; con otro rol,
 * lleva al inicio de su propio rol.
 */
export function rolGuard(roles: readonly RolUsuario[]): CanMatchFn {
  return (_ruta, segmentos) => {
    const sesion = inject(SesionService).sesion();
    if (sesion === null) {
      return urlIngresar(segmentos);
    }
    if (roles.includes(sesion.rol)) {
      return true;
    }
    return inject(Router).parseUrl(RUTA_INICIO_POR_ROL[sesion.rol]);
  };
}

/** Para las pantallas de quien todavía no ingresó: con sesión, lleva al inicio de su rol. */
export const invitadoGuard: CanMatchFn = () => {
  const sesion = inject(SesionService).sesion();
  return sesion === null ? true : inject(Router).parseUrl(RUTA_INICIO_POR_ROL[sesion.rol]);
};

/** Ruta raíz ("/"): al inicio del rol, o a ingresar si no hay sesión. */
export const redirigirAlInicio: RedirectFunction = () => {
  const sesion = inject(SesionService).sesion();
  return sesion === null ? RUTA_INGRESAR : RUTA_INICIO_POR_ROL[sesion.rol];
};

/** /ingresar?volver=<la ruta pedida>, para volver ahí después de ingresar. */
function urlIngresar(segmentos: UrlSegment[]): UrlTree {
  const volver = `/${segmentos.map((segmento) => segmento.path).join('/')}`;
  return inject(Router).createUrlTree([RUTA_INGRESAR], { queryParams: { volver } });
}
