import { Provincia, TipoEmpresa } from '../../core/api/modelos';

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
