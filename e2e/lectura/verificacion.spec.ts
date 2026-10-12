import { expect, test } from '@playwright/test';
import { cuentaFarmacia } from '../soporte/cuentas';
import { ingresar } from '../soporte/ingreso';
import {
  GTIN_DEMO,
  SERIE_DEMO,
  TEXTOS_ESTADO_VERIFICACION,
  verificarCaja,
} from '../soporte/verificacion';

// e2e de LECTURA: verificación pública de una caja (no necesita sesión ni modifica datos).
// Los datos de la demo pueden avanzar de estado: de la caja de la demo solo se afirma que
// el estado sea uno válido. Una serie inexistente sí es determinista (NO_EXISTE).

test.describe('verificación pública', () => {
  test('se llega sin sesión y desde la pantalla de ingreso', async ({ page }) => {
    await page.goto('/ingresar');
    await page.getByRole('link', { name: 'Verificalo sin ingresar' }).click();

    await expect(page).toHaveURL(/\/verificar$/);
    await expect(page.getByRole('heading', { name: 'Verificar un medicamento' })).toBeVisible();
  });

  test('con los campos vacíos pide GTIN y serie', async ({ page }) => {
    await page.goto('/verificar');
    await page.getByRole('button', { name: 'Verificar' }).click();

    await expect(page.getByText('Escribí el GTIN de la caja.')).toBeVisible();
    await expect(page.getByText('Escribí el número de serie de la caja.')).toBeVisible();
  });

  test('un GTIN con dígito verificador inválido muestra el error de la API en el campo', async ({ page }) => {
    await page.goto('/verificar');
    await page.getByLabel('GTIN', { exact: true }).fill('07799000009999');
    await page.getByLabel('Número de serie').fill('X1');
    await page.getByRole('button', { name: 'Verificar' }).click();

    await expect(page.getByText(/El GTIN no es válido/)).toBeVisible();
    await expect(page.locator('mc-resultado-verificacion')).toHaveCount(0);
  });

  test('una serie inexistente se informa como "No existe", con el mensaje de la API', async ({ page }) => {
    await verificarCaja(page, GTIN_DEMO, 'NOEXISTE1');

    const resultado = page.locator('mc-resultado-verificacion');
    await expect(resultado.locator('mc-estado')).toContainText('No existe');
    await expect(resultado.locator('.mensaje')).not.toBeEmpty();
    await expect(resultado.locator('.recorrido')).toHaveCount(0);
  });

  test('la caja de la demo muestra un estado válido y al menos una etapa de recorrido', async ({ page }) => {
    await verificarCaja(page, GTIN_DEMO, SERIE_DEMO);

    const resultado = page.locator('mc-resultado-verificacion');
    const estado = (await resultado.locator('mc-estado').first().textContent())?.trim() ?? '';
    expect(TEXTOS_ESTADO_VERIFICACION as readonly string[]).toContain(estado);
    expect(await resultado.locator('.recorrido li').count()).toBeGreaterThanOrEqual(1);
    await expect(resultado).toContainText('Laboratorio Andino Cuyano S.A.');
  });

  test('"Pegar el código completo" reparte un código GS1 en GTIN y serie', async ({ page }) => {
    await page.goto('/verificar');
    const pegado = page.getByLabel('Pegar el código completo (opcional)');
    await pegado.fill(`(01)${GTIN_DEMO}(21)${SERIE_DEMO}`);
    await pegado.press('Tab');

    await expect(page.getByLabel('GTIN', { exact: true })).toHaveValue(GTIN_DEMO);
    await expect(page.getByLabel('Número de serie')).toHaveValue(SERIE_DEMO);
    await expect(page.getByText('Código leído')).toBeVisible();

    await page.getByRole('button', { name: 'Verificar' }).click();
    await expect(page.locator('mc-resultado-verificacion')).toBeVisible();
  });

  test('un código que no se reconoce avisa y no completa nada', async ({ page }) => {
    await page.goto('/verificar');
    const pegado = page.getByLabel('Pegar el código completo (opcional)');
    await pegado.fill('esto no es un código');
    await pegado.press('Tab');

    await expect(page.getByText('No pudimos leer este código')).toBeVisible();
    await expect(page.getByLabel('GTIN', { exact: true })).toHaveValue('');
  });

  test('la pantalla no pide datos personales', async ({ page }) => {
    await page.goto('/verificar');
    await expect(page.getByRole('heading', { name: 'Verificar un medicamento' })).toBeVisible();

    const etiquetas = await page.locator('mat-form-field mat-label').allTextContents();
    expect(etiquetas.map((e) => e.trim())).toEqual(['Pegar el código completo (opcional)', 'GTIN', 'Número de serie']);
  });

  test('con sesión también se puede verificar, y el encabezado ofrece volver a la cuenta', async ({ page }) => {
    await ingresar(page, cuentaFarmacia());

    await page.goto('/verificar');

    await expect(page.getByRole('heading', { name: 'Verificar un medicamento' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Volver a mi cuenta' })).toBeVisible();
  });
});
