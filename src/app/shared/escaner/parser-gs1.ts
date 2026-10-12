// Parser de códigos GS1 (lo que codifica el DataMatrix de una caja de medicamento).
//
// Reconoce los Application Identifiers (AI) que usa MediChain:
//   (01) GTIN, 14 dígitos          (17) vencimiento AAMMDD
//   (10) lote, hasta 20 caracteres  (21) serie, hasta 20 caracteres
//
// Formatos aceptados:
//   1. Con paréntesis, legible:  (01)07799000001010(21)L20260001S000001
//   2. Crudo, como lo entregan las pistolas USB: 0107799000001010 21 L20260001S000001
//      donde los campos de largo variable (10, 21) terminan con el carácter GS (\x1D).
//   3. Cualquiera de los anteriores con el prefijo de simbología ]d2 (DataMatrix).
//
// NO valida el dígito verificador del GTIN ni el formato de la serie: eso lo decide la API
// (R3). El parser solo separa los campos.

/** Carácter separador de grupo (GS, ASCII 29) que cierra un campo de largo variable. */
const GS = '\x1D';

/** Prefijo de identificación de simbología de DataMatrix GS1. */
const PREFIJO_SIMBOLOGIA = ']d2';

/** Datos que se pudieron leer de un código GS1. */
export interface DatosGs1 {
  readonly gtin: string;
  readonly serie: string;
  readonly lote: string | null;
  /** Vencimiento tal cual viene (AAMMDD), sin interpretar. */
  readonly vencimiento: string | null;
}

/** Largo de los AI de largo fijo (en caracteres, sin contar el AI). */
const LARGO_FIJO: Readonly<Record<string, number>> = { '01': 14, '17': 6 };

/** AI de largo variable que reconocemos, con su máximo. */
const MAXIMO_VARIABLE: Readonly<Record<string, number>> = { '10': 20, '21': 20 };

/**
 * Lee un código GS1 y devuelve GTIN y serie (y lote y vencimiento si vienen).
 * Devuelve null si el texto no tiene un GTIN (01) y una serie (21) reconocibles.
 */
export function parsearGs1(texto: string): DatosGs1 | null {
  let resto = texto.trim();
  if (resto.startsWith(PREFIJO_SIMBOLOGIA)) {
    resto = resto.slice(PREFIJO_SIMBOLOGIA.length);
  }
  const campos = resto.includes('(') ? camposConParentesis(resto) : camposCrudos(resto);
  if (campos === null) {
    return null;
  }
  const gtin = campos.get('01');
  const serie = campos.get('21');
  if (gtin === undefined || !/^\d{14}$/.test(gtin) || serie === undefined || serie === '') {
    return null;
  }
  return { gtin, serie, lote: campos.get('10') ?? null, vencimiento: campos.get('17') ?? null };
}

/** Formato con paréntesis: `(AI)valor(AI)valor…`. */
function camposConParentesis(texto: string): Map<string, string> | null {
  const campos = new Map<string, string>();
  const patron = /\((\d{2,4})\)([^(]*)/gy;
  let consumido = 0;
  let coincidencia: RegExpExecArray | null;
  while ((coincidencia = patron.exec(texto)) !== null) {
    campos.set(coincidencia[1], coincidencia[2].replaceAll(GS, '').trim());
    consumido = patron.lastIndex;
  }
  return consumido === texto.length ? campos : null;
}

/** Formato crudo: `AIvalor`, los de largo fijo seguidos; los variables terminan en GS (o al final). */
function camposCrudos(texto: string): Map<string, string> | null {
  const campos = new Map<string, string>();
  let posicion = 0;
  while (posicion < texto.length) {
    if (texto[posicion] === GS) {
      posicion += 1;
      continue;
    }
    const ai = texto.slice(posicion, posicion + 2);
    posicion += 2;
    const largoFijo = LARGO_FIJO[ai];
    if (largoFijo !== undefined) {
      campos.set(ai, texto.slice(posicion, posicion + largoFijo));
      posicion += largoFijo;
    } else if (MAXIMO_VARIABLE[ai] !== undefined) {
      const fin = texto.indexOf(GS, posicion);
      const hasta = fin === -1 ? texto.length : fin;
      campos.set(ai, texto.slice(posicion, Math.min(hasta, posicion + MAXIMO_VARIABLE[ai])));
      posicion = hasta;
    } else {
      // AI que no manejamos: no se puede saber dónde termina.
      return null;
    }
  }
  return campos;
}

/**
 * Lee lo que la persona pega en "Pegar el código completo": un código GS1 (en cualquiera de
 * sus formatos) o, como alternativa, un GTIN de 14 dígitos y la serie separados por
 * espacio, coma, punto y coma o tabulación ("07799000001010 L20260001S000001").
 * Devuelve null si no se reconoce ninguno.
 */
export function leerCodigoPegado(texto: string): Pick<DatosGs1, 'gtin' | 'serie'> | null {
  const gs1 = parsearGs1(texto);
  if (gs1 !== null) {
    return { gtin: gs1.gtin, serie: gs1.serie };
  }
  const separado = /^(\d{14})[\s,;]+([A-Za-z0-9]{1,20})$/.exec(texto.trim());
  return separado === null ? null : { gtin: separado[1], serie: separado[2] };
}
