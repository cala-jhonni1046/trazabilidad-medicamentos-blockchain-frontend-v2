import { RolUsuario } from '../api/modelos';

/** Pantalla de ingreso. */
export const RUTA_INGRESAR = '/ingresar';

/**
 * Inicio de cada rol: la ruta raíz de sus pantallas (ver app.routes.ts).
 * Es un Record: si el backend agrega un rol, no compila hasta darle su inicio.
 */
export const RUTA_INICIO_POR_ROL: Record<RolUsuario, string> = {
  SEDE_CENTRAL: '/sede',
  INSPECTOR: '/inspector',
  LABORATORIO: '/laboratorio',
  DISTRIBUIDOR: '/distribuidora',
  FARMACIA: '/farmacia',
  PACIENTE: '/paciente',
};
