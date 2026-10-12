// @ts-check
/**
 * Funciones compartidas por los scripts del contrato con el backend
 * (`api-descargar.mjs` y `api-verificar.mjs`).
 *
 * Sin dependencias: solo Node (fetch y fs nativos). El contrato es el OpenAPI
 * que publica el backend en /api-docs (solo con SWAGGER_HABILITADO=true).
 */
import { readFile } from 'node:fs/promises';

/** URL por defecto del contrato publicado por el backend. */
export const URL_CONTRATO_POR_DEFECTO = 'http://localhost:8080/api-docs';

/** Ruta del contrato versionado en este repositorio (va a Git). */
export const RUTA_CONTRATO_LOCAL = 'api/openapi.json';

/** Tiempo máximo de espera de la descarga, en milisegundos. */
const ESPERA_MAXIMA_MS = 15000;

/** Métodos HTTP que pueden aparecer como operaciones dentro de un path. */
const METODOS_HTTP = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];

/**
 * @typedef {{ tipo: 'url', valor: string } | { tipo: 'archivo', valor: string }} OrigenContrato
 * De dónde se obtiene el contrato: la URL del backend o un archivo local.
 */

/**
 * Lee los argumentos de la línea de comandos: `--url <url>` o `--archivo <ruta>`.
 * Sin argumentos, el origen es la URL por defecto. Termina el proceso con un
 * mensaje si los argumentos son inválidos.
 *
 * @param {string[]} argumentos argumentos después del nombre del script
 * @returns {OrigenContrato}
 */
export function leerOrigen(argumentos) {
  if (argumentos.length === 0) {
    return { tipo: 'url', valor: URL_CONTRATO_POR_DEFECTO };
  }
  const [opcion, valor] = argumentos;
  if (argumentos.length === 2 && opcion === '--url' && valor) {
    return { tipo: 'url', valor };
  }
  if (argumentos.length === 2 && opcion === '--archivo' && valor) {
    return { tipo: 'archivo', valor };
  }
  terminarConError(
    'Argumentos inválidos. Uso: [--url <url>] o [--archivo <ruta>]\n' +
      `  Sin argumentos se usa ${URL_CONTRATO_POR_DEFECTO}`,
    2,
  );
}

/**
 * Describe el origen para los mensajes al usuario.
 *
 * @param {OrigenContrato} origen
 * @returns {string}
 */
export function describirOrigen(origen) {
  return origen.tipo === 'url' ? origen.valor : `el archivo ${origen.valor}`;
}

/**
 * Obtiene el contrato desde su origen y valida que sea un OpenAPI 3.x.
 * Ante cualquier problema (backend caído, 404, JSON inválido) termina el
 * proceso con un mensaje que explica qué hacer y código de salida 2.
 *
 * @param {OrigenContrato} origen
 * @returns {Promise<Record<string, unknown>>} el contrato ya parseado
 */
export async function obtenerContrato(origen) {
  const texto = origen.tipo === 'url' ? await descargarTexto(origen.valor) : await leerTexto(origen.valor);
  /** @type {unknown} */
  let contrato;
  try {
    contrato = JSON.parse(texto);
  } catch {
    terminarConError(`El contenido de ${describirOrigen(origen)} no es JSON válido.`, 2);
  }
  validarContrato(contrato, origen);
  return contrato;
}

/**
 * Lee el contrato versionado del repositorio, si existe.
 *
 * @returns {Promise<Record<string, unknown> | null>} el contrato, o null si todavía no existe
 */
export async function leerContratoLocal() {
  try {
    const texto = await readFile(RUTA_CONTRATO_LOCAL, 'utf8');
    return JSON.parse(texto);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Serializa el contrato siempre igual (2 espacios y salto de línea final),
 * para que los diffs de `api/openapi.json` muestren solo cambios reales.
 *
 * @param {Record<string, unknown>} contrato
 * @returns {string}
 */
export function serializarContrato(contrato) {
  return `${JSON.stringify(contrato, null, 2)}\n`;
}

/**
 * @typedef {object} DiferenciasContrato
 * @property {string[]} operacionesAgregadas  "GET /api/x (operationId)"
 * @property {string[]} operacionesQuitadas
 * @property {string[]} operacionesModificadas
 * @property {string[]} esquemasAgregados
 * @property {string[]} esquemasQuitados
 * @property {string[]} esquemasModificados
 * @property {string[]} otrasSeccionesModificadas  claves de primer nivel (info, tags, servers…)
 */

/**
 * Compara dos contratos y lista qué operaciones, esquemas y secciones cambiaron.
 * La comparación es por contenido: el orden de las claves de un objeto no cuenta,
 * el orden de los elementos de un array sí.
 *
 * @param {Record<string, unknown>} anterior
 * @param {Record<string, unknown>} nuevo
 * @returns {DiferenciasContrato}
 */
export function compararContratos(anterior, nuevo) {
  const operacionesAnteriores = indexarOperaciones(anterior);
  const operacionesNuevas = indexarOperaciones(nuevo);
  const esquemasAnteriores = indexarEsquemas(anterior);
  const esquemasNuevos = indexarEsquemas(nuevo);
  const operaciones = compararMapas(operacionesAnteriores, operacionesNuevas);
  const esquemas = compararMapas(esquemasAnteriores, esquemasNuevos);

  // Secciones de primer nivel fuera de paths y components (info, tags, servers, security…).
  const clavesPrimerNivel = new Set([...Object.keys(anterior), ...Object.keys(nuevo)]);
  clavesPrimerNivel.delete('paths');
  clavesPrimerNivel.delete('components');
  const otrasSeccionesModificadas = [...clavesPrimerNivel].filter(
    (clave) => !sonIguales(anterior[clave], nuevo[clave]),
  );
  // Dentro de components, lo que no son esquemas (securitySchemes, etc.).
  const componentesAnteriores = /** @type {Record<string, unknown>} */ (anterior['components'] ?? {});
  const componentesNuevos = /** @type {Record<string, unknown>} */ (nuevo['components'] ?? {});
  const clavesComponentes = new Set([...Object.keys(componentesAnteriores), ...Object.keys(componentesNuevos)]);
  clavesComponentes.delete('schemas');
  for (const clave of clavesComponentes) {
    if (!sonIguales(componentesAnteriores[clave], componentesNuevos[clave])) {
      otrasSeccionesModificadas.push(`components.${clave}`);
    }
  }

  return {
    operacionesAgregadas: operaciones.agregadas,
    operacionesQuitadas: operaciones.quitadas,
    operacionesModificadas: operaciones.modificadas,
    esquemasAgregados: esquemas.agregadas,
    esquemasQuitados: esquemas.quitadas,
    esquemasModificados: esquemas.modificadas,
    otrasSeccionesModificadas,
  };
}

/**
 * Indica si no hay ninguna diferencia.
 *
 * @param {DiferenciasContrato} diferencias
 * @returns {boolean}
 */
export function sinDiferencias(diferencias) {
  return Object.values(diferencias).every((lista) => lista.length === 0);
}

/**
 * Imprime las diferencias agrupadas, una línea por elemento.
 *
 * @param {DiferenciasContrato} diferencias
 */
export function imprimirDiferencias(diferencias) {
  const grupos = [
    ['Operaciones agregadas', diferencias.operacionesAgregadas, '+'],
    ['Operaciones quitadas', diferencias.operacionesQuitadas, '-'],
    ['Operaciones modificadas', diferencias.operacionesModificadas, '~'],
    ['Esquemas agregados', diferencias.esquemasAgregados, '+'],
    ['Esquemas quitados', diferencias.esquemasQuitados, '-'],
    ['Esquemas modificados', diferencias.esquemasModificados, '~'],
    ['Otras secciones modificadas', diferencias.otrasSeccionesModificadas, '~'],
  ];
  for (const [titulo, lista, marca] of grupos) {
    if (lista.length > 0) {
      console.log(`  ${titulo} (${lista.length}):`);
      for (const elemento of lista) {
        console.log(`    ${marca} ${elemento}`);
      }
    }
  }
}

/**
 * Cuenta operaciones y esquemas, para el resumen de una línea.
 *
 * @param {Record<string, unknown>} contrato
 * @returns {string}
 */
export function resumirContrato(contrato) {
  return `${indexarOperaciones(contrato).size} operaciones, ${indexarEsquemas(contrato).size} esquemas`;
}

/**
 * Muestra el mensaje por la salida de error y termina el proceso.
 *
 * @param {string} mensaje
 * @param {number} codigoSalida
 * @returns {never}
 */
export function terminarConError(mensaje, codigoSalida) {
  console.error(`✘ ${mensaje}`);
  process.exit(codigoSalida);
}

// ---------------------------------------------------------------------------
// Funciones internas
// ---------------------------------------------------------------------------

/**
 * Descarga el texto de la URL. Explica los dos problemas habituales:
 * backend apagado y Swagger deshabilitado (404).
 *
 * @param {string} url
 * @returns {Promise<string>}
 */
async function descargarTexto(url) {
  /** @type {Response} */
  let respuesta;
  try {
    respuesta = await fetch(url, { signal: AbortSignal.timeout(ESPERA_MAXIMA_MS) });
  } catch {
    terminarConError(
      `No se pudo conectar con ${url}. ¿Está levantado el backend?\n` +
        '  Alternativa sin backend: --archivo ~/con-blockchain/docs/openapi.json',
      2,
    );
  }
  if (respuesta.status === 404) {
    terminarConError(
      `${url} respondió 404: el backend publica /api-docs solo con SWAGGER_HABILITADO=true.\n` +
        '  Alternativa: --archivo ~/con-blockchain/docs/openapi.json',
      2,
    );
  }
  if (!respuesta.ok) {
    terminarConError(`${url} respondió ${respuesta.status}.`, 2);
  }
  return respuesta.text();
}

/**
 * Lee un archivo de texto; si no existe, termina con un mensaje claro.
 *
 * @param {string} ruta
 * @returns {Promise<string>}
 */
async function leerTexto(ruta) {
  try {
    return await readFile(ruta, 'utf8');
  } catch {
    terminarConError(`No se pudo leer el archivo ${ruta}.`, 2);
  }
}

/**
 * Comprueba la forma mínima de un OpenAPI 3.x: versión, paths y esquemas.
 *
 * @param {unknown} contrato
 * @param {OrigenContrato} origen
 * @returns {asserts contrato is Record<string, unknown>}
 */
function validarContrato(contrato, origen) {
  const esObjeto = (/** @type {unknown} */ valor) => typeof valor === 'object' && valor !== null && !Array.isArray(valor);
  const valido =
    esObjeto(contrato) &&
    typeof (/** @type {Record<string, unknown>} */ (contrato)['openapi']) === 'string' &&
    String(/** @type {Record<string, unknown>} */ (contrato)['openapi']).startsWith('3.') &&
    esObjeto(/** @type {Record<string, unknown>} */ (contrato)['paths']) &&
    esObjeto(/** @type {Record<string, unknown>} */ (contrato)['components']);
  if (!valido) {
    terminarConError(`El contenido de ${describirOrigen(origen)} no parece un contrato OpenAPI 3.x.`, 2);
  }
}

/**
 * Arma un mapa "MÉTODO /ruta (operationId)" → definición de la operación.
 *
 * @param {Record<string, unknown>} contrato
 * @returns {Map<string, unknown>}
 */
function indexarOperaciones(contrato) {
  /** @type {Map<string, unknown>} */
  const operaciones = new Map();
  const paths = /** @type {Record<string, Record<string, unknown>>} */ (contrato['paths'] ?? {});
  for (const [ruta, definicionRuta] of Object.entries(paths)) {
    for (const metodo of METODOS_HTTP) {
      const operacion = /** @type {Record<string, unknown> | undefined} */ (definicionRuta[metodo]);
      if (operacion) {
        const id = typeof operacion['operationId'] === 'string' ? ` (${operacion['operationId']})` : '';
        operaciones.set(`${metodo.toUpperCase()} ${ruta}${id}`, operacion);
      }
    }
  }
  return operaciones;
}

/**
 * Arma un mapa nombre del esquema → definición.
 *
 * @param {Record<string, unknown>} contrato
 * @returns {Map<string, unknown>}
 */
function indexarEsquemas(contrato) {
  const componentes = /** @type {Record<string, unknown>} */ (contrato['components'] ?? {});
  const esquemas = /** @type {Record<string, unknown>} */ (componentes['schemas'] ?? {});
  return new Map(Object.entries(esquemas));
}

/**
 * Compara dos mapas por clave y contenido.
 *
 * @param {Map<string, unknown>} anterior
 * @param {Map<string, unknown>} nuevo
 * @returns {{ agregadas: string[], quitadas: string[], modificadas: string[] }}
 */
function compararMapas(anterior, nuevo) {
  const agregadas = [...nuevo.keys()].filter((clave) => !anterior.has(clave));
  const quitadas = [...anterior.keys()].filter((clave) => !nuevo.has(clave));
  const modificadas = [...nuevo.keys()].filter(
    (clave) => anterior.has(clave) && !sonIguales(anterior.get(clave), nuevo.get(clave)),
  );
  return { agregadas, quitadas, modificadas };
}

/**
 * Igualdad profunda de valores JSON: ignora el orden de las claves de los
 * objetos y respeta el orden de los arrays.
 *
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
function sonIguales(a, b) {
  if (a === b) {
    return true;
  }
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((valor, i) => sonIguales(valor, b[i]));
  }
  const objetoA = /** @type {Record<string, unknown>} */ (a);
  const objetoB = /** @type {Record<string, unknown>} */ (b);
  const clavesA = Object.keys(objetoA);
  const clavesB = Object.keys(objetoB);
  return clavesA.length === clavesB.length && clavesA.every((clave) => clave in objetoB && sonIguales(objetoA[clave], objetoB[clave]));
}
