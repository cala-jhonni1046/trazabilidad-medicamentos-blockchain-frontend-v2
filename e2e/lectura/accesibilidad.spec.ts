import AxeBuilder from '@axe-core/playwright';
import { Page, expect, test } from '@playwright/test';
import { cuentaDistribuidora, cuentaFarmacia, cuentaInspector, cuentaLaboratorio, cuentaPaciente, cuentaSede } from '../soporte/cuentas';
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

    test('Sede: inspectores y cadena', async ({ page }) => {
      await ingresar(page, cuentaSede());
      await page.goto('/sede/inspectores');
      await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 20_000 });
      await sinViolaciones(page);
      await page.goto('/sede/cadena');
      await expect(page.getByText('Último evento local')).toBeVisible();
      await expect(page.locator('mc-tarjeta', { hasText: 'Eventos de la cadena' }).locator('tbody tr').first()).toBeVisible({ timeout: 20_000 });
      await sinViolaciones(page);
    });

    test('Inspector: bandeja y lotes', async ({ page }) => {
      await ingresar(page, cuentaInspector());
      await expect(page.getByRole('heading', { name: 'Pendientes de tu acción' })).toBeVisible();
      await expect(page.locator('main').getByText('Cargando…')).toHaveCount(0, { timeout: 20_000 });
      await sinViolaciones(page);
      await page.goto('/inspector/lotes');
      await expect(page.locator('mc-tarjeta', { hasText: 'Lotes' }).first().locator('tbody tr').first()).toBeVisible({ timeout: 20_000 });
      await sinViolaciones(page);
    });

    test('Laboratorio: lotes y bultos', async ({ page }) => {
      await ingresar(page, cuentaLaboratorio());
      await page.goto('/laboratorio/lotes');
      await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 20_000 });
      await sinViolaciones(page);
      await page.goto('/laboratorio/bultos');
      await expect(page.getByRole('heading', { name: 'Armar un bulto' })).toBeVisible();
      await expect(page.locator('main').getByText('Buscando lotes y circuitos…')).toHaveCount(0, { timeout: 20_000 });
      await sinViolaciones(page);
    });

    test('Distribuidora: recepción', async ({ page }) => {
      await ingresar(page, cuentaDistribuidora());
      await page.goto('/distribuidora/recepcion');
      await expect(page.getByRole('heading', { name: 'Escanear un bulto' })).toBeVisible();
      await expect(page.locator('main').getByText('Cargando…')).toHaveCount(0, { timeout: 20_000 });
      await sinViolaciones(page);
    });

    test('Farmacia: dispensar y stock', async ({ page }) => {
      await ingresar(page, cuentaFarmacia());
      await page.goto('/farmacia/dispensar');
      await expect(page.getByRole('heading', { name: 'Dispensar una caja' })).toBeVisible();
      await expect(page.locator('main').getByText('Cargando…')).toHaveCount(0, { timeout: 20_000 });
      await sinViolaciones(page);
      await page.goto('/farmacia/stock');
      await expect(page.locator('tbody tr, .mc-vacio').first()).toBeVisible({ timeout: 20_000 });
      await sinViolaciones(page);
    });

    test('Paciente: verificar y reportar', async ({ page }) => {
      await ingresar(page, cuentaPaciente());
      await expect(page.getByRole('heading', { name: 'Reportar un problema con una caja' })).toBeVisible();
      await sinViolaciones(page);
    });

    test('inicio con sesión (marco con menú lateral)', async ({ page }) => {
      await ingresar(page, cuentaFarmacia());
      await sinViolaciones(page);
    });
  });
}
