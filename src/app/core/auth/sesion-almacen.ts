import { PROVINCIA, ROL_USUARIO } from '../api/modelos';
import { Sesion } from './sesion.model';

/** Clave de sessionStorage donde se guarda la sesión (se borra al cerrar la pestaña). */
export const CLAVE_SESION = 'mc.sesion';

/**
 * Lee la sesión guardada en sessionStorage.
 * Devuelve null si no hay, si no se puede leer o si no tiene la forma esperada
 * (lo guardado no es confiable: se valida campo por campo).
 */
export function leerSesionGuardada(almacen: Storage | null): Sesion | null {
  if (almacen === null) {
    return null;
  }
  try {
    const texto = almacen.getItem(CLAVE_SESION);
    if (texto === null) {
      return null;
    }
    const valor: unknown = JSON.parse(texto);
    return esSesion(valor) ? valor : null;
  } catch {
    return null;
  }
}

/** Guarda la sesión; si el navegador no deja guardar, la sesión dura hasta recargar. */
export function guardarSesion(almacen: Storage | null, sesion: Sesion): void {
  try {
    almacen?.setItem(CLAVE_SESION, JSON.stringify(sesion));
  } catch {
    // Almacenamiento bloqueado: la sesión sigue en memoria.
  }
}

/** Borra la sesión guardada, si se puede. */
export function borrarSesionGuardada(almacen: Storage | null): void {
  try {
    almacen?.removeItem(CLAVE_SESION);
  } catch {
    // Almacenamiento bloqueado: no había nada que borrar.
  }
}

/** Valida la forma completa de una sesión guardada. */
function esSesion(valor: unknown): valor is Sesion {
  if (typeof valor !== 'object' || valor === null) {
    return false;
  }
  const campos = valor as Record<string, unknown>;
  return (
    esTextoNoVacio(campos['token']) &&
    esTextoNoVacio(campos['expiraEn']) &&
    !Number.isNaN(Date.parse(campos['expiraEn'])) &&
    esTextoNoVacio(campos['usuarioId']) &&
    typeof campos['nombre'] === 'string' &&
    typeof campos['rol'] === 'string' &&
    (ROL_USUARIO as readonly string[]).includes(campos['rol']) &&
    (campos['empresaId'] === null || esTextoNoVacio(campos['empresaId'])) &&
    typeof campos['esAdminEmpresa'] === 'boolean' &&
    typeof campos['esDirectorTecnico'] === 'boolean' &&
    (campos['provincia'] === null ||
      (typeof campos['provincia'] === 'string' && (PROVINCIA as readonly string[]).includes(campos['provincia'])))
  );
}

/** Texto con al menos un carácter. */
function esTextoNoVacio(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.length > 0;
}
