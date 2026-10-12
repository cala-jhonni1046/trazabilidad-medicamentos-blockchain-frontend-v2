import { Page, expect, test } from '@playwright/test';
import { cuentaDistribuidora, cuentaLaboratorio } from '../soporte/cuentas';
import { ingresar } from '../soporte/ingreso';

// e2e de LECTURA: pantallas del laboratorio y de la distribuidora. Solo miran; lo que modifica
// datos está en e2e/flujo y en los tests unitarios.

async function irA(page: Page, entrada: string): Promise<void> {
  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: entrada, exact: true }).click();
}

async function sinErroresDeCarga(page: Page): Promise<void> {
  await expect(page.locator('main').getByText(/Cargando…|Buscando/)).toHaveCount(0, { timeout: 20_000 });
  await expect(page.locator('main mc-error-api [role="alert"], main .mc-falla')).toHaveCount(0);
}

test.describe('Laboratorio', () => {
  test('aterriza en Circuitos y recorre sus pantallas sin errores', async ({ page }) => {
    await ingresar(page, cuentaLaboratorio());
    const menu = page.getByRole('navigation', { name: 'Secciones' });
    await expect(menu.getByRole('link')).toHaveText(['Circuitos', 'Medicamentos', 'Lotes', 'Bultos', 'Viajes', 'Equipo']);
    await expect(page.getByRole('heading', { level: 1, name: 'Circuitos' })).toBeVisible();
    await sinErroresDeCarga(page);

    for (const [entrada, titulo] of [
      ['Medicamentos', 'Medicamentos'],
      ['Lotes', 'Lotes'],
      ['Bultos', 'Bultos'],
      ['Viajes', 'Viajes · tramo 1'],
      ['Equipo', 'Equipo'],
    ]) {
      await irA(page, entrada);
      await expect(page.getByRole('heading', { level: 1, name: titulo })).toBeVisible();
      await sinErroresDeCarga(page);
    }
  });

  test('Medicamentos y Lotes muestran lo registrado en la demo', async ({ page }) => {
    await ingresar(page, cuentaLaboratorio());

    await irA(page, 'Medicamentos');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('tbody').first()).toContainText(/\d{14}/);

    await irA(page, 'Lotes');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('tbody mc-estado mat-icon').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Registrar un lote' })).toBeVisible();
  });

  test('los lotes no ofrecen acciones de inspector ("Poner en cuarentena")', async ({ page }) => {
    await ingresar(page, cuentaLaboratorio());
    await irA(page, 'Lotes');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 20_000 });

    await expect(page.getByRole('button', { name: /Poner en cuarentena/ })).toHaveCount(0);
  });

  test('"Registrar un lote" abre el formulario y valida los campos obligatorios sin llamar a la API', async ({ page }) => {
    await ingresar(page, cuentaLaboratorio());
    await irA(page, 'Lotes');

    await page.getByRole('button', { name: 'Registrar un lote' }).click();
    const dialogo = page.getByRole('dialog');
    await expect(dialogo.getByRole('heading', { name: 'Registrar un lote' })).toBeVisible();
    await expect(dialogo.getByLabel('Código del lote')).toBeVisible({ timeout: 20_000 });
    await dialogo.getByRole('button', { name: 'Registrar lote' }).click();

    await expect(dialogo.getByText('Elegí el medicamento.')).toBeVisible();
    await expect(dialogo.getByText('Escribí el código del lote.')).toBeVisible();
  });

  test('Bultos y Viajes muestran sus formularios o explican qué falta', async ({ page }) => {
    await ingresar(page, cuentaLaboratorio());

    await irA(page, 'Bultos');
    await expect(page.getByRole('heading', { name: 'Armar un bulto' })).toBeVisible();
    await sinErroresDeCarga(page);

    await irA(page, 'Viajes');
    await expect(page.getByRole('heading', { name: 'Armar un viaje' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Viajes', exact: true })).toBeVisible();
  });

  test('un laboratorio no entra a las pantallas de la distribuidora', async ({ page }) => {
    await ingresar(page, cuentaLaboratorio());

    await page.goto('/distribuidora/recepcion');

    await expect(page).toHaveURL(/\/laboratorio$/);
  });
});

test.describe('Distribuidora', () => {
  test('aterriza en Circuitos y recorre sus pantallas sin errores', async ({ page }) => {
    await ingresar(page, cuentaDistribuidora());
    const menu = page.getByRole('navigation', { name: 'Secciones' });
    await expect(menu.getByRole('link')).toHaveText(['Circuitos', 'Recibir bultos', 'Depósito', 'Viajes', 'Equipo']);
    await sinErroresDeCarga(page);

    for (const [entrada, titulo] of [
      ['Recibir bultos', 'Recibir bultos'],
      ['Depósito', 'Depósito'],
      ['Viajes', 'Viajes · tramo 2'],
      ['Equipo', 'Equipo'],
    ]) {
      await irA(page, entrada);
      await expect(page.getByRole('heading', { level: 1, name: titulo })).toBeVisible();
      await sinErroresDeCarga(page);
    }
  });

  test('Recibir bultos: viajes en camino, formulario y actas; sin completar pide los datos', async ({ page }) => {
    await ingresar(page, cuentaDistribuidora());
    await irA(page, 'Recibir bultos');

    await expect(page.getByRole('heading', { name: 'En camino hacia vos' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Escanear un bulto' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recepciones registradas' })).toBeVisible();
    await page.getByRole('button', { name: 'Registrar recepción' }).click();

    await expect(page.getByText('Escaneá o escribí el código del bulto.')).toBeVisible();
    await expect(page.getByText('Escribí cuántas cajas contaste.')).toBeVisible();
    await expect(page.getByText('Escribí la temperatura de llegada.')).toBeVisible();
  });

  test('un código de bulto inexistente se informa con el mensaje de la API (simulado)', async ({ page }) => {
    await page.route('**/api/recepciones', (ruta) =>
      ruta.request().method() === 'POST'
        ? ruta.fulfill({ status: 404, json: { status: 404, message: 'No existe un bulto con ese código', regla: null, errors: null } })
        : ruta.continue(),
    );
    await ingresar(page, cuentaDistribuidora());
    await irA(page, 'Recibir bultos');

    await page.getByLabel('Código del bulto').fill('BUL-9999');
    await page.getByLabel('Cajas contadas').fill('10');
    await page.getByLabel('Temperatura de llegada (°C)').fill('4,5');
    await page.getByRole('button', { name: 'Registrar recepción' }).click();

    await expect(page.locator('mc-formulario-recepcion').getByRole('alert')).toContainText('No existe un bulto con ese código');
  });

  test('una distribuidora no entra a las pantallas del laboratorio', async ({ page }) => {
    await ingresar(page, cuentaDistribuidora());

    await page.goto('/laboratorio/lotes');

    await expect(page).toHaveURL(/\/distribuidora$/);
  });
});
