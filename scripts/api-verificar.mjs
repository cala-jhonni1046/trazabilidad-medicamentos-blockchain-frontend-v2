// @ts-check
/**
 * npm run api:verificar [-- --url <url> | -- --archivo <ruta>]
 *
 * Compara el contrato versionado (api/openapi.json) con el del backend y
 * lista las diferencias. No modifica nada: para actualizar, `npm run api:descargar`.
 *
 * Códigos de salida: 0 iguales, 1 difieren (o falta el contrato local),
 * 2 no se pudo obtener el contrato del backend.
 */
import {
  RUTA_CONTRATO_LOCAL,
  compararContratos,
  describirOrigen,
  imprimirDiferencias,
  leerContratoLocal,
  leerOrigen,
  obtenerContrato,
  resumirContrato,
  sinDiferencias,
} from './contrato-comun.mjs';

const origen = leerOrigen(process.argv.slice(2));
const local = await leerContratoLocal();
if (local === null) {
  console.error(`✘ No existe ${RUTA_CONTRATO_LOCAL}: corré "npm run api:descargar".`);
  process.exit(1);
}

const remoto = await obtenerContrato(origen);
const diferencias = compararContratos(local, remoto);

if (sinDiferencias(diferencias)) {
  console.log(`✔ ${RUTA_CONTRATO_LOCAL} coincide con ${describirOrigen(origen)} (${resumirContrato(local)}).`);
  process.exit(0);
}

console.error(`✘ ${RUTA_CONTRATO_LOCAL} NO coincide con ${describirOrigen(origen)}:`);
imprimirDiferencias(diferencias);
console.error('  Para actualizarlo: npm run api:descargar (y después npm run api:generar).');
process.exit(1);
