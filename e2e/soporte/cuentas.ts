import { RolUsuario } from '../../src/app/core/api/modelos';

/**
 * Cuentas de la demo del backend (DatosDemo). Los emails son datos de prueba públicos;
 * las contraseñas NUNCA están en el repositorio: salen de variables de entorno.
 *
 *   E2E_DEMO_PASSWORD   contraseña de las cuentas *.demo (DEMO_PASSWORD del backend)
 *   E2E_ADMIN_EMAIL     email de la Sede Central (ADMIN_EMAIL del backend)
 *   E2E_ADMIN_PASSWORD  contraseña de la Sede Central (ADMIN_PASSWORD del backend)
 */
export interface Cuenta {
  readonly rol: RolUsuario;
  readonly email: string;
  readonly password: string;
  /** Rótulo del rol que muestra la barra lateral. */
  readonly rotulo: string;
  /** Ruta de inicio del rol. */
  readonly inicio: string;
  /** Texto de la entrada de menú del inicio ("Tablero" para la Sede, "Inicio" para el resto). */
  readonly entradaMenu: string;
  /** Texto con el que empieza el título de la pantalla de inicio ("Tablero" / "Hola,"). */
  readonly tituloInicio: string;
}

/** Lee una variable de entorno obligatoria; si falta, el test falla explicando cuál. */
function variableObligatoria(nombre: string): string {
  const valor = process.env[nombre];
  if (valor === undefined || valor === '') {
    throw new Error(
      `Falta la variable de entorno ${nombre}. Exportala en tu terminal antes de correr los e2e (ver CLAUDE.md).`,
    );
  }
  return valor;
}

/** Cuenta de la demo para un rol de empresa, inspector o paciente. */
function cuentaDemo(
  rol: RolUsuario,
  email: string,
  rotulo: string,
  inicio: string,
  entradaMenu = 'Inicio',
  tituloInicio = 'Hola,',
): Cuenta {
  return {
    rol,
    email,
    password: variableObligatoria('E2E_DEMO_PASSWORD'),
    rotulo,
    inicio,
    entradaMenu,
    tituloInicio,
  };
}

/** La cuenta de la Sede Central (sus credenciales no son de la demo). */
export function cuentaSede(): Cuenta {
  return {
    rol: 'SEDE_CENTRAL',
    email: variableObligatoria('E2E_ADMIN_EMAIL'),
    password: variableObligatoria('E2E_ADMIN_PASSWORD'),
    rotulo: 'Sede Central ANMAT',
    inicio: '/sede',
    entradaMenu: 'Tablero',
    tituloInicio: 'Tablero',
  };
}

export const cuentaInspector = (): Cuenta =>
  cuentaDemo('INSPECTOR', 'inspector.mendoza@medichain.demo', 'Inspector ANMAT', '/inspector', 'Bandeja', 'Pendientes de tu acción');
export const cuentaLaboratorio = (): Cuenta =>
  cuentaDemo('LABORATORIO', 'admin@laboratorio-andino.demo', 'Laboratorio', '/laboratorio', 'Circuitos', 'Circuitos');
export const cuentaDistribuidora = (): Cuenta =>
  cuentaDemo('DISTRIBUIDOR', 'admin@distribuidora-piedemonte.demo', 'Distribuidora', '/distribuidora', 'Circuitos', 'Circuitos');
export const cuentaFarmacia = (): Cuenta =>
  cuentaDemo('FARMACIA', 'admin@farmacia-cerroarco.demo', 'Farmacia', '/farmacia', 'Circuitos', 'Circuitos');
export const cuentaPaciente = (): Cuenta =>
  cuentaDemo('PACIENTE', 'paciente@medichain.demo', 'Paciente', '/paciente', 'Verificar un medicamento', 'Verificar un medicamento');

/** Cadena nueva de la demo (B12): Distribuidora del Valle de Uco y Farmacia del Parque (CIR-0003, lote L2026-0010). */
export const cuentaDistribuidoraValleDeUco = (): Cuenta =>
  cuentaDemo('DISTRIBUIDOR', 'admin@distribuidora-valleuco.demo', 'Distribuidora', '/distribuidora', 'Circuitos', 'Circuitos');
export const cuentaFarmaciaDelParque = (): Cuenta =>
  cuentaDemo('FARMACIA', 'admin@farmacia-parque.demo', 'Farmacia', '/farmacia', 'Circuitos', 'Circuitos');

/** Las seis cuentas, una por rol (como funciones: así la variable se lee recién al usarla). */
export const CUENTAS_POR_ROL: readonly (() => Cuenta)[] = [
  cuentaSede,
  cuentaInspector,
  cuentaLaboratorio,
  cuentaDistribuidora,
  cuentaFarmacia,
  cuentaPaciente,
];
