import { Page, expect, test } from '@playwright/test';
import { cuentaFarmacia, cuentaInspector, cuentaLaboratorio, cuentaPaciente, cuentaSede } from '../soporte/cuentas';
import { ingresar } from '../soporte/ingreso';
import { GTIN_DEMO } from '../soporte/verificacion';

// e2e de LECTURA: trazabilidad por código. Solo busca (GET): no modifica nada.
// Se apoya en los datos de la demo: lote L2026-0001 (Laboratorio Andino), bulto BUL-0001 y la caja L20260001S000011.

async function irATrazabilidad(page: Page): Promise<void> {
  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Trazabilidad' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Trazabilidad por código' })).toBeVisible();
}

async function buscarLote(page: Page, codigo: string): Promise<void> {
  await page.getByLabel('Un lote').check();
  await page.getByLabel('Código del lote').fill(codigo);
  await page.getByRole('button', { name: 'Buscar' }).click();
}

test.describe('Trazabilidad por código', () => {
  test('el laboratorio busca su lote: ve el medicamento, su laboratorio y los eventos en orden', async ({ page }) => {
    await ingresar(page, cuentaLaboratorio());
    await irATrazabilidad(page);

    await buscarLote(page, 'L2026-0001');

    await expect(page.locator('#titulo-resultado')).toContainText('1 resultado', { timeout: 20_000 });
    const resultado = page.locator('mc-resultado-recorrido');
    await expect(resultado).toContainText('Cuyafen');
    await expect(resultado).toContainText('Laboratorio Andino');
    const eventos = resultado.locator('.linea li');
    await expect(eventos.first()).toContainText('Lote registrado');
    const numeros = await resultado.locator('.numero').allTextContents();
    const valores = numeros.map((n) => Number(n.replace('#', '')));
    expect(valores).toEqual([...valores].sort((a, b) => a - b));
  });

  test('un bulto: sus eventos incluyen los de su viaje', async ({ page }) => {
    await ingresar(page, cuentaLaboratorio());
    await irATrazabilidad(page);

    await page.getByLabel('Un bulto').check();
    await page.getByLabel('Código del bulto').fill('BUL-0001');
    await page.getByRole('button', { name: 'Buscar' }).click();

    const resultado = page.locator('mc-resultado-recorrido');
    await expect(resultado).toContainText('Bulto armado', { timeout: 20_000 });
    await expect(resultado).toContainText('Viaje');
  });

  test('una caja por GTIN y serie: trae lo de su lote y su bulto', async ({ page }) => {
    await ingresar(page, cuentaSede());
    await irATrazabilidad(page);

    await page.getByLabel('GTIN', { exact: true }).fill(GTIN_DEMO);
    await page.getByLabel('Número de serie').fill('L20260001S000011');
    await page.getByRole('button', { name: 'Buscar' }).click();

    const resultado = page.locator('mc-resultado-recorrido');
    await expect(resultado).toContainText('Caja', { timeout: 20_000 });
    await expect(resultado).toContainText('Lote registrado');
    await expect(resultado).toContainText('Bulto armado');
  });

  test('lo que no existe o no es de la empresa da el 404 de la API, con su mensaje', async ({ page }) => {
    await ingresar(page, cuentaFarmacia());
    await irATrazabilidad(page);

    await buscarLote(page, 'NO-EXISTE-99');

    await expect(page.locator('mc-error-api [role="alert"]')).toContainText('que puedas ver', { timeout: 20_000 });
    await expect(page.locator('mc-resultado-recorrido')).toHaveCount(0);
  });

  test('sin completar el código pide el dato y no busca', async ({ page }) => {
    await ingresar(page, cuentaInspector());
    await irATrazabilidad(page);

    await page.getByRole('button', { name: 'Buscar' }).click();

    await expect(page.getByText('Escribí el GTIN de la caja.')).toBeVisible();
    await expect(page.locator('mc-resultado-recorrido')).toHaveCount(0);
  });

  test('R13: no muestra datos personales ni datos crudos del evento', async ({ page }) => {
    await ingresar(page, cuentaSede());
    await irATrazabilidad(page);
    await buscarLote(page, 'L2026-0001');
    await expect(page.locator('mc-resultado-recorrido')).toBeVisible({ timeout: 20_000 });

    await expect(page.locator('main')).not.toContainText(/datosJson|"entidadId"|dni|afiliado|obra social/i);
  });

  test('el paciente no tiene la pantalla: ni en el menú ni por la dirección', async ({ page }) => {
    await ingresar(page, cuentaPaciente());
    await expect(page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Trazabilidad' })).toHaveCount(0);

    await page.goto('/laboratorio/trazabilidad');
    await expect(page).toHaveURL(/\/paciente$/);
  });
});
