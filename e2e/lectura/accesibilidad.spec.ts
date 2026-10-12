import AxeBuilder from '@axe-core/playwright';
import { Page, expect, test } from '@playwright/test';
import { cuentaFarmacia, cuentaSede } from '../soporte/cuentas';
import { ingresar } from '../soporte/ingreso';
import { GTIN_DEMO, SERIE_DEMO, verificarCaja } from '../soporte/verificacion';

// e2e de LECTURA: accesibilidad automática (axe, reglas WCAG 2 A y AA) en claro y oscuro.
// axe no reemplaza una revisión manual con teclado y lector de pantalla.

/** Modos de color del sistema a probar (el tema es "sistema" por defecto). */
const MODOS = ['light', 'dark'] as const;

/** Analiza la página y falla listando cada violación. */
async function sinViolaciones(page: Page): Promise<void> {
  const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const resumen = resultado.violations.map(
    (v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`,
  );
  expect(resumen, 'violaciones de accesibilidad').toEqual([]);
}

for (const modo of MODOS) {
  test.describe(`accesibilidad · modo ${modo}`, () => {
    test.use({ colorScheme: modo });

    test('pantalla de ingreso', async ({ page }) => {
      await page.goto('/ingresar');
      await expect(page.getByRole('heading', { name: 'Ingresar' })).toBeVisible();
      await sinViolaciones(page);
    });

    test('pantalla de ingreso con errores de validación', async ({ page }) => {
      await page.goto('/ingresar');
      await page.getByRole('button', { name: 'Ingresar' }).click();
      await expect(page.getByText('Escribí tu contraseña.')).toBeVisible();
      await sinViolaciones(page);
    });

    test('verificación pública: formulario', async ({ page }) => {
      await page.goto('/verificar');
      await expect(page.getByRole('heading', { name: 'Verificar un medicamento' })).toBeVisible();
      await sinViolaciones(page);
    });

    test('verificación pública: caja que no existe (estado crítico)', async ({ page }) => {
      await verificarCaja(page, GTIN_DEMO, 'NOEXISTE1');
      await sinViolaciones(page);
    });

    test('verificación pública: caja de la demo con recorrido', async ({ page }) => {
      await verificarCaja(page, GTIN_DEMO, SERIE_DEMO);
      await sinViolaciones(page);
    });

    test('tablero de la Sede con mosaicos y listas', async ({ page }) => {
      await ingresar(page, cuentaSede());
      await expect(page.locator('mc-mosaico .valor').first()).toHaveText(/^\s*\d[\d.]*\s*$/);
      await expect(page.locator('mc-tarjeta').first()).toBeVisible();
      await sinViolaciones(page);
    });

    test('inicio con sesión (marco con menú lateral)', async ({ page }) => {
      await ingresar(page, cuentaFarmacia());
      await sinViolaciones(page);
    });
  });
}
