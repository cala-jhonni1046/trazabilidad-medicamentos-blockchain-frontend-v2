import { expect, test } from '@playwright/test';
import { cuentaDistribuidoraValleDeUco, cuentaFarmaciaDelParque } from '../soporte/cuentas';
import { ingresar } from '../soporte/ingreso';

// e2e de LECTURA: la cadena nueva de la demo del backend (B12f): Distribuidora del Valle de Uco y
// Farmacia del Parque, circuito CIR-0003 y lote L2026-0010 (4 cajas en la farmacia, 3 en el depósito de la
// distribuidora y 3 en un viaje en tránsito). Solo miran. Si el autor ya operó sobre esos datos, los
// conteos pueden haber cambiado: por eso se piden "al menos uno", no cantidades exactas.

test.describe('Cadena nueva de la demo', () => {
  test('Farmacia del Parque: tiene cajas en stock y cajas en camino, cada una en su tarjeta', async ({ page }) => {
    await ingresar(page, cuentaFarmaciaDelParque());
    await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Stock', exact: true }).click();

    const enStock = page.locator('mc-lista-cajas', { has: page.getByRole('heading', { name: 'En stock' }) });
    const enCamino = page.locator('mc-lista-cajas', { has: page.getByRole('heading', { name: 'En camino' }) });
    await expect(enStock.locator('tbody tr').first()).toBeVisible({ timeout: 20_000 });
    await expect(enCamino.locator('tbody tr').first()).toBeVisible({ timeout: 20_000 });
    await expect(enStock.locator('tbody tr').first()).toContainText('Cuyafen');
    await expect(enStock.locator('tbody tr').first()).toContainText('En stock');
    await expect(enStock.getByRole('button', { name: /Devolver/ }).first()).toBeVisible();
    await expect(enCamino.locator('tbody tr').first()).toContainText('En tránsito');
    await expect(enCamino.getByRole('button', { name: /Devolver/ })).toHaveCount(0);
  });

  test('Distribuidora del Valle de Uco: ve un bulto en su depósito del circuito CIR-0003 y su viaje en tránsito con temperatura', async ({ page }) => {
    await ingresar(page, cuentaDistribuidoraValleDeUco());
    const menu = page.getByRole('navigation', { name: 'Secciones' });

    await menu.getByRole('link', { name: 'Depósito' }).click();
    const fila = page.locator('tbody tr').first();
    await expect(fila).toBeVisible({ timeout: 20_000 });
    await expect(fila).toContainText('CIR-0003');
    await expect(fila).toContainText('Farmacia del Parque');
    await expect(fila).toContainText('En depósito');

    await menu.getByRole('link', { name: 'Viajes' }).click();
    const enTransito = page.locator('tbody tr', { hasText: 'En tránsito' }).first();
    await expect(enTransito).toBeVisible({ timeout: 20_000 });
    await expect(enTransito).toContainText('Distribuidora del Valle de Uco');
    await enTransito.getByRole('button', { name: /Temperatura/ }).click();
    await expect(page.locator('main mc-grafico-temperatura')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('main .mc-falla')).toHaveCount(0);
  });

  test('Viajes: el filtro por estado pide ?estado= a la API', async ({ page }) => {
    await ingresar(page, cuentaDistribuidoraValleDeUco());
    await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Viajes' }).click();
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 20_000 });

    const pedido = page.waitForRequest((r) => r.url().includes('/api/viajes') && r.url().includes('estado=EN_TRANSITO'));
    await page.getByRole('combobox', { name: /Estado/ }).click();
    await page.getByRole('option', { name: 'En tránsito' }).click();
    await pedido;
    await expect(page.locator('tbody tr').first()).toContainText('En tránsito');
  });

  test('la Farmacia del Parque encuentra el lote L2026-0010 en Trazabilidad (le llegaron bultos)', async ({ page }) => {
    await ingresar(page, cuentaFarmaciaDelParque());
    await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Trazabilidad' }).click();

    await page.getByLabel('Un lote').check();
    await page.getByLabel('Código del lote').fill('L2026-0010');
    await page.getByRole('button', { name: 'Buscar' }).click();

    await expect(page.locator('mc-resultado-recorrido')).toContainText('Lote registrado', { timeout: 20_000 });
    await expect(page.locator('mc-resultado-recorrido')).toContainText('Laboratorio Andino');
  });
});
