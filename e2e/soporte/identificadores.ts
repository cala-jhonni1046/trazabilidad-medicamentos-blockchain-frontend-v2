import { randomBytes, randomInt } from 'node:crypto';

// Identificadores válidos y únicos por corrida, para los e2e de FLUJO que dan de alta datos.
// Ninguno es un secreto: son datos de prueba (los registros quedan en la base de la demo).

/** Dígito verificador GS1 (módulo 10) de un texto de dígitos: pesos 3,1,3,1… desde la derecha. */
export function digitoVerificadorGs1(cuerpo: string): number {
  let suma = 0;
  for (let i = 0; i < cuerpo.length; i++) {
    const digito = Number(cuerpo[cuerpo.length - 1 - i]);
    suma += digito * (i % 2 === 0 ? 3 : 1);
  }
  return (10 - (suma % 10)) % 10;
}

/** Dígito verificador de un CUIT (módulo 11) sobre sus 10 primeros dígitos; null si ese cuerpo no tiene CUIT válido. */
export function digitoVerificadorCuit(cuerpo: string): number | null {
  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const suma = pesos.reduce((acumulado, peso, i) => acumulado + peso * Number(cuerpo[i]), 0);
  const resto = 11 - (suma % 11);
  if (resto === 10) {
    return null;
  }
  return resto === 11 ? 0 : resto;
}

/** Dígitos al azar. */
function digitosAlAzar(cantidad: number): string {
  return Array.from({ length: cantidad }, () => String(randomInt(0, 10))).join('');
}

/** Un CUIT de persona jurídica (30-…) con dígito verificador válido, distinto en cada llamada. */
export function cuitUnico(): string {
  for (;;) {
    const cuerpo = `30${digitosAlAzar(8)}`;
    const digito = digitoVerificadorCuit(cuerpo);
    if (digito !== null) {
      return `${cuerpo}${digito}`;
    }
  }
}

/** Un GLN de 13 dígitos (prefijo 779) con dígito verificador GS1 válido, distinto en cada llamada. */
export function glnUnico(): string {
  const cuerpo = `779${digitosAlAzar(9)}`;
  return `${cuerpo}${digitoVerificadorGs1(cuerpo)}`;
}

/** Un DNI de 8 dígitos al azar (no empieza con 0). */
export function dniAlAzar(): string {
  return `${randomInt(1, 10)}${digitosAlAzar(7)}`;
}

/** Contraseña aleatoria de una sola vida para la cuenta de prueba creada (cumple mayúscula, minúscula, número y símbolo). */
export function contrasenaDeUnaVez(): string {
  return `Aa1!${randomBytes(9).toString('base64url')}`;
}

/** Un sufijo corto y distinto en cada corrida, para nombres y emails. */
export function sufijoUnico(): string {
  return randomBytes(4).toString('hex');
}
