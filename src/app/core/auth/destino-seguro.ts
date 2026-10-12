import { RolUsuario } from '../api/modelos';
import { RUTA_INGRESAR, RUTA_INICIO_POR_ROL } from './rutas-sesion';
import { MotivoFinSesion } from './sesion.model';

/** Texto que explica por qué se pide ingresar de nuevo (query param `motivo`). */
export const MENSAJE_POR_MOTIVO: Record<Exclude<MotivoFinSesion, 'salida'>, string> = {
  vencida: 'Tu sesión venció. Ingresá de nuevo.',
  rechazada: 'Tu sesión ya no es válida. Ingresá de nuevo.',
};

/** Mensaje del query param `motivo`, o null si falta o no es uno conocido. */
export function mensajeDeMotivo(motivo: string | null): string | null {
  return motivo === 'vencida' || motivo === 'rechazada' ? MENSAJE_POR_MOTIVO[motivo] : null;
}

/**
 * A dónde ir después de ingresar: la ruta de `volver` si es una ruta interna segura; si no,
 * el inicio del rol. Una ruta segura empieza con una sola "/" (nunca "//" ni "/\", que el
 * navegador toma como otro sitio) y no es la propia pantalla de ingreso.
 */
export function destinoDespuesDeIngresar(volver: string | null, rol: RolUsuario): string {
  const esInterna =
    volver !== null && volver.startsWith('/') && !volver.startsWith('//') && !volver.startsWith('/\\');
  const esIngresar = volver !== null && volver.startsWith(RUTA_INGRESAR);
  return esInterna && !esIngresar ? volver : RUTA_INICIO_POR_ROL[rol];
}
