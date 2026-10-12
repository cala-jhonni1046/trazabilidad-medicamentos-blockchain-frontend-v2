import { expect, test } from '@playwright/test';
import {
  cuitUnico,
  digitoVerificadorCuit,
  digitoVerificadorGs1,
  glnUnico,
} from '../soporte/identificadores';

// Pruebas de las funciones puras de los generadores (no abren el navegador ni tocan el backend).

test.describe('identificadores de prueba', () => {
  test('dígito verificador GS1: GTIN de la demo (07799000001010) y un GLN conocido', () => {
    expect(digitoVerificadorGs1('0779900000101')).toBe(0);
    expect(digitoVerificadorGs1('779000000000')).toBe(3);
  });

  test('dígito verificador de CUIT: 20-11111111-2 es válido', () => {
    expect(digitoVerificadorCuit('2011111111')).toBe(2);
  });

  test('cuitUnico() da CUIT de 11 dígitos con dígito verificador correcto y distintos entre sí', () => {
    const cuits = Array.from({ length: 50 }, () => cuitUnico());
    for (const cuit of cuits) {
      expect(cuit).toMatch(/^30\d{9}$/);
      expect(digitoVerificadorCuit(cuit.slice(0, 10))).toBe(Number(cuit[10]));
    }
    expect(new Set(cuits).size).toBe(cuits.length);
  });

  test('glnUnico() da GLN de 13 dígitos con dígito verificador GS1 correcto y distintos entre sí', () => {
    const glns = Array.from({ length: 50 }, () => glnUnico());
    for (const gln of glns) {
      expect(gln).toMatch(/^779\d{10}$/);
      expect(digitoVerificadorGs1(gln.slice(0, 12))).toBe(Number(gln[12]));
    }
    expect(new Set(glns).size).toBe(glns.length);
  });
});
