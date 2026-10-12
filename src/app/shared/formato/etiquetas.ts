import {
  AlcanceCuarentena,
  MotivoDevolucion,
  MotivoBloqueo,
  MotivoReporte,
  Provincia,
  TipoEmpresa,
  TipoEvento,
  TramoDespacho,
} from '../../core/api/modelos';

// Textos para mostrar de los enums "de dominio" que no son estados (los estados van en
// catalogo-estados.ts). Son Records: un valor nuevo del contrato no compila sin su texto.

/** Nombre de cada provincia. */
export const ROTULO_PROVINCIA: Record<Provincia, string> = {
  BUENOS_AIRES: 'Buenos Aires',
  CABA: 'CABA',
  CATAMARCA: 'Catamarca',
  CHACO: 'Chaco',
  CHUBUT: 'Chubut',
  CORDOBA: 'Córdoba',
  CORRIENTES: 'Corrientes',
  ENTRE_RIOS: 'Entre Ríos',
  FORMOSA: 'Formosa',
  JUJUY: 'Jujuy',
  LA_PAMPA: 'La Pampa',
  LA_RIOJA: 'La Rioja',
  MENDOZA: 'Mendoza',
  MISIONES: 'Misiones',
  NEUQUEN: 'Neuquén',
  RIO_NEGRO: 'Río Negro',
  SALTA: 'Salta',
  SAN_JUAN: 'San Juan',
  SAN_LUIS: 'San Luis',
  SANTA_CRUZ: 'Santa Cruz',
  SANTA_FE: 'Santa Fe',
  SANTIAGO_DEL_ESTERO: 'Santiago del Estero',
  TIERRA_DEL_FUEGO: 'Tierra del Fuego',
  TUCUMAN: 'Tucumán',
};

/** Nombre de cada tipo de empresa. */
export const ROTULO_TIPO_EMPRESA: Record<TipoEmpresa, string> = {
  LABORATORIO: 'Laboratorio',
  DISTRIBUIDOR: 'Distribuidora',
  FARMACIA: 'Farmacia',
};

/** Alcance de una medida sanitaria. */
export const ROTULO_ALCANCE: Record<AlcanceCuarentena, string> = {
  LOTE: 'Lote',
  DESPACHO: 'Viaje',
  BULTO: 'Bulto',
};

/** Motivo de una medida sanitaria. */
export const ROTULO_MOTIVO_MEDIDA: Record<MotivoBloqueo, string> = {
  PREVENTIVA: 'Preventiva',
  DEFECTO_CALIDAD: 'Defecto de calidad',
  RUPTURA_FRIO: 'Ruptura de cadena de frío',
  ROBO: 'Robo o extravío',
  RECHAZO_RECEPCION: 'Recepción rechazada',
};

/** Motivo de un reporte ciudadano. */
export const ROTULO_MOTIVO_REPORTE: Record<MotivoReporte, string> = {
  SOSPECHA_FALSIFICACION: 'Sospecha de falsificación',
  ENVASE_DANADO: 'Envase dañado',
  EFECTO_ADVERSO: 'Efecto adverso',
  OTRO: 'Otro',
};

/** Tipos de evento de la cadena de trazabilidad (la lista única del backend). */
export const ROTULO_TIPO_EVENTO: Record<TipoEvento, string> = {
  ALTA_INSPECTOR: 'Alta de inspector',
  BAJA_INSPECTOR: 'Baja de inspector',
  REACTIVACION_INSPECTOR: 'Reactivación de inspector',
  SOLICITUD_HABILITACION: 'Solicitud de habilitación',
  SOLICITUD_TOMADA: 'Solicitud tomada',
  SOLICITUD_ASIGNADA: 'Solicitud asignada por la Sede',
  HABILITACION_APROBADA: 'Empresa habilitada',
  HABILITACION_RECHAZADA: 'Habilitación rechazada',
  EMPRESA_SUSPENDIDA: 'Empresa suspendida',
  EMPRESA_REHABILITADA: 'Empresa rehabilitada',
  CIRCUITO_PROPUESTO: 'Circuito propuesto',
  CIRCUITO_ACEPTADO: 'Circuito aceptado',
  CIRCUITO_RECHAZADO: 'Circuito rechazado',
  CIRCUITO_TOMADO: 'Circuito tomado',
  CIRCUITO_ASIGNADO: 'Circuito asignado por la Sede',
  CIRCUITO_APROBADO: 'Circuito aprobado',
  CIRCUITO_SUSPENDIDO: 'Circuito suspendido',
  CIRCUITO_REHABILITADO: 'Circuito rehabilitado',
  MEDICAMENTO_REGISTRADO: 'Medicamento registrado',
  LOTE_REGISTRADO: 'Lote registrado',
  LOTE_LIBERADO: 'Lote liberado',
  INTENTO_SERIE_INVALIDA: 'Intento con series inválidas',
  BULTO_ARMADO: 'Bulto armado',
  BULTO_DESARMADO: 'Bulto desarmado',
  VIAJE_CREADO: 'Viaje creado',
  VIAJE_SALIDA: 'Salida del camión',
  VIAJE_CANCELADO: 'Viaje cancelado',
  RUPTURA_FRIO: 'Ruptura de cadena de frío',
  VIAJE_FINALIZADO: 'Viaje finalizado',
  ROBO_EXTRAVIO: 'Robo o extravío',
  BULTO_RECIBIDO: 'Bulto recibido',
  BULTO_RECHAZADO: 'Bulto rechazado',
  BULTO_INEXISTENTE: 'Bulto inexistente escaneado',
  BULTO_DUPLICADO: 'Bulto ya recibido escaneado',
  CUARENTENA: 'Cuarentena',
  CUARENTENA_TOMADA: 'Cuarentena tomada',
  CUARENTENA_LEVANTADA: 'Cuarentena levantada',
  RECALL: 'Recall',
  DISPENSACION: 'Dispensación',
  ANULACION_DISPENSA: 'Dispensa anulada',
  DEVOLUCION: 'Devolución',
  INTENTO_DUPLICADO: 'Serie ya dispensada presentada',
  SERIE_INEXISTENTE: 'Serie inexistente consultada',
  SERIE_ROBADA: 'Serie robada presentada',
  REPORTE_CIUDADANO: 'Reporte ciudadano',
  REPORTE_TOMADO: 'Reporte tomado',
  REPORTE_CERRADO: 'Reporte cerrado',
};

/** Tramo de un viaje. */
export const ROTULO_TRAMO: Record<TramoDespacho, string> = {
  LAB_A_DISTRIBUIDOR: 'Laboratorio → Distribuidora',
  DISTRIBUIDOR_A_FARMACIA: 'Distribuidora → Farmacias',
};

/** Motivo de la devolución de una caja a la farmacia. */
export const ROTULO_MOTIVO_DEVOLUCION: Record<MotivoDevolucion, string> = {
  DANADA: 'Caja dañada',
  VENCIDA: 'Vencida',
  RETIRO_DEL_MERCADO: 'Retiro del mercado',
  OTRO: 'Otro',
};
