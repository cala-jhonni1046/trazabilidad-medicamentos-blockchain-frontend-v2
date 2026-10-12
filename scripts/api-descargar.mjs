// @ts-check
/**
 * npm run api:descargar [-- --url <url> | -- --archivo <ruta>]
 *
 * Baja el contrato OpenAPI del backend y lo guarda en api/openapi.json, siempre
 * con el mismo formato. Si ya había un contrato, muestra qué cambió.
 * Después hay que revisar `git diff api/openapi.json` y correr `npm run api:generar`.
 *
 * Códigos de salida: 0 contrato guardado (o sin cambios), 2 no se pudo obtener.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import {
  RUTA_CONTRATO_LOCAL,
  compararContratos,
  describirOrigen,
  imprimirDiferencias,
  leerContratoLocal,
  leerOrigen,
  obtenerContrato,
  resumirContrato,
  serializarContrato,
  sinDiferencias,
} from './contrato-comun.mjs';

const origen = leerOrigen(process.argv.slice(2));
console.log(`Descargando el contrato desde ${describirOrigen(origen)}…`);

const nuevo = await obtenerContrato(origen);
const anterior = await leerContratoLocal();

if (anterior !== null) {
  const diferencias = compararContratos(anterior, nuevo);
  if (sinDiferencias(diferencias)) {
    // Se reescribe igual, por si el archivo tenía otro formato.
    await writeFile(RUTA_CONTRATO_LOCAL, serializarContrato(nuevo), 'utf8');
    console.log(`✔ Sin cambios en ${RUTA_CONTRATO_LOCAL} (${resumirContrato(nuevo)}).`);
    process.exit(0);
  }
  console.log('Cambios respecto del contrato anterior:');
  imprimirDiferencias(diferencias);
}

await mkdir(dirname(RUTA_CONTRATO_LOCAL), { recursive: true });
await writeFile(RUTA_CONTRATO_LOCAL, serializarContrato(nuevo), 'utf8');
console.log(`✔ Guardado ${RUTA_CONTRATO_LOCAL} (${resumirContrato(nuevo)}).`);
console.log(`  Siguiente: revisá "git diff ${RUTA_CONTRATO_LOCAL}" y corré "npm run api:generar".`);
