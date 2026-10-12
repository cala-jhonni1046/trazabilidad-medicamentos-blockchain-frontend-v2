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
  SEDE_CENTRAL: [
    { texto: 'Tablero', ruta: RUTA_INICIO_POR_ROL.SEDE_CENTRAL, icono: 'dashboard' },
    { texto: 'Inspectores', ruta: '/sede/inspectores', icono: 'person' },
    { texto: 'Empresas', ruta: '/sede/empresas', icono: 'domain' },
    { texto: 'Circuitos', ruta: '/sede/circuitos', icono: 'link' },
    { texto: 'Cadena y Sepolia', ruta: '/sede/cadena', icono: 'verified' },
    { texto: 'Usuarios', ruta: '/sede/usuarios', icono: 'person' },
  ],
  INSPECTOR: [
    { texto: 'Bandeja', ruta: RUTA_INICIO_POR_ROL.INSPECTOR, icono: 'dashboard' },
    { texto: 'Empresas', ruta: '/inspector/empresas', icono: 'domain' },
    { texto: 'Circuitos', ruta: '/inspector/circuitos', icono: 'link' },
    { texto: 'Lotes y cuarentenas', ruta: '/inspector/lotes', icono: 'warning' },
    { texto: 'Reportes', ruta: '/inspector/reportes', icono: 'report' },
    { texto: 'Cadena y Sepolia', ruta: '/inspector/cadena', icono: 'verified' },
  ],
  LABORATORIO: [
    { texto: 'Circuitos', ruta: RUTA_INICIO_POR_ROL.LABORATORIO, icono: 'link' },
    { texto: 'Medicamentos', ruta: '/laboratorio/medicamentos', icono: 'inventory_2' },
    { texto: 'Lotes', ruta: '/laboratorio/lotes', icono: 'dashboard' },
    { texto: 'Bultos', ruta: '/laboratorio/bultos', icono: 'inventory_2' },
    { texto: 'Viajes', ruta: '/laboratorio/viajes', icono: 'local_shipping' },
    { texto: 'Equipo', ruta: '/laboratorio/equipo', icono: 'person' },
  ],
  DISTRIBUIDOR: [
    { texto: 'Circuitos', ruta: RUTA_INICIO_POR_ROL.DISTRIBUIDOR, icono: 'link' },
    { texto: 'Recibir bultos', ruta: '/distribuidora/recepcion', icono: 'inventory_2' },
    { texto: 'Depósito', ruta: '/distribuidora/deposito', icono: 'domain' },
    { texto: 'Viajes', ruta: '/distribuidora/viajes', icono: 'local_shipping' },
    { texto: 'Equipo', ruta: '/distribuidora/equipo', icono: 'person' },
  ],
  FARMACIA: [{ texto: 'Inicio', ruta: RUTA_INICIO_POR_ROL.FARMACIA, icono: 'home' }],
  PACIENTE: [{ texto: 'Inicio', ruta: RUTA_INICIO_POR_ROL.PACIENTE, icono: 'home' }],
};
