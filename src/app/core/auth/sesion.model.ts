import { LoginResponseDto, Provincia, RolUsuario } from '../api/modelos';

/**
 * Sesión del usuario autenticado: lo que devuelve el login, con los campos opcionales
 * normalizados a null. El rol y las marcas sirven solo para mostrar u ocultar cosas;
 * los permisos los decide la API.
 */
export interface Sesion {
  /** JWT para el header Authorization. Nunca se loguea. */
  readonly token: string;
  /** Vencimiento del token: ISO-8601 en UTC con Z. */
  readonly expiraEn: string;
  readonly usuarioId: string;
  readonly nombre: string;
  readonly rol: RolUsuario;
  /** Empresa del usuario; null para SEDE_CENTRAL, INSPECTOR y PACIENTE. */
  readonly empresaId: string | null;
  /** Puede crear empleados y aceptar circuitos de su empresa. */
  readonly esAdminEmpresa: boolean;
  /** Director técnico: libera lotes comunes y propone circuitos. */
  readonly esDirectorTecnico: boolean;
  /** Provincia del inspector; null para los demás roles. */
  readonly provincia: Provincia | null;
}

/**
 * Por qué termina una sesión:
 * - salida: la persona tocó "Salir";
 * - vencida: llegó la hora de expiraEn;
 * - rechazada: la API respondió 401 (token inválido o cuenta desactivada).
 */
export type MotivoFinSesion = 'salida' | 'vencida' | 'rechazada';

/** Arma la sesión a partir de la respuesta del login. */
export function sesionDesdeLogin(respuesta: LoginResponseDto): Sesion {
  return {
    token: respuesta.token,
    expiraEn: respuesta.expiraEn,
    usuarioId: respuesta.usuarioId,
    nombre: respuesta.nombre,
    rol: respuesta.rol,
    empresaId: respuesta.empresaId ?? null,
    esAdminEmpresa: respuesta.esAdminEmpresa,
    esDirectorTecnico: respuesta.esDirectorTecnico,
    provincia: respuesta.provincia ?? null,
  };
}

/** Indica si la sesión ya venció en el instante dado (milisegundos desde 1970, como Date.now()). */
export function sesionVencida(sesion: Sesion, ahoraMs: number): boolean {
  return Date.parse(sesion.expiraEn) <= ahoraMs;
}
