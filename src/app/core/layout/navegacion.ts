import { RolUsuario } from '../api/modelos';
import { RUTA_INICIO_POR_ROL } from '../auth/rutas-sesion';
import { NombreIcono } from '../../shared/ui/iconos';

/** Una entrada del menú lateral. */
export interface ElementoMenu {
  readonly texto: string;
  readonly ruta: string;
  readonly icono: NombreIcono;
}

/** Nombre de cada rol para mostrar. */
export const ROTULO_ROL: Record<RolUsuario, string> = {
  SEDE_CENTRAL: 'Sede Central ANMAT',
  INSPECTOR: 'Inspector ANMAT',
  LABORATORIO: 'Laboratorio',
  DISTRIBUIDOR: 'Distribuidora',
  FARMACIA: 'Farmacia',
  PACIENTE: 'Paciente',
};

/**
 * Menú lateral de cada rol: el ÚNICO lugar donde se define. Es un Record: un rol nuevo del
 * contrato no compila hasta darle su menú. Cada paso que agrega una pantalla suma su entrada
 * acá. Ocultar una entrada es comodidad: el permiso real lo decide la API.
 */
export const MENU_POR_ROL: Record<RolUsuario, readonly ElementoMenu[]> = {
  SEDE_CENTRAL: [{ texto: 'Inicio', ruta: RUTA_INICIO_POR_ROL.SEDE_CENTRAL, icono: 'home' }],
  INSPECTOR: [{ texto: 'Inicio', ruta: RUTA_INICIO_POR_ROL.INSPECTOR, icono: 'home' }],
  LABORATORIO: [{ texto: 'Inicio', ruta: RUTA_INICIO_POR_ROL.LABORATORIO, icono: 'home' }],
  DISTRIBUIDOR: [{ texto: 'Inicio', ruta: RUTA_INICIO_POR_ROL.DISTRIBUIDOR, icono: 'home' }],
  FARMACIA: [{ texto: 'Inicio', ruta: RUTA_INICIO_POR_ROL.FARMACIA, icono: 'home' }],
  PACIENTE: [{ texto: 'Inicio', ruta: RUTA_INICIO_POR_ROL.PACIENTE, icono: 'home' }],
};
