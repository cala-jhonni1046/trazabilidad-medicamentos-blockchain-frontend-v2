import { Page, expect, test } from '@playwright/test';
import { cuentaFarmacia, cuentaPaciente } from '../soporte/cuentas';
import { ingresar } from '../soporte/ingreso';
import { GTIN_DEMO } from '../soporte/verificacion';

// e2e de LECTURA: pantallas de la farmacia y del paciente. Solo miran; los errores que no se
// pueden provocar de verdad (409 al dispensar) se simulan con page.route y nunca llegan al backend.

async function irA(page: Page, entrada: string): Promise<void> {
  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: entrada, exact: true }).click();
}

async function sinErroresDeCarga(page: Page): Promise<void> {
  await expect(page.locator('main').getByText(/Cargando…|Buscando/)).toHaveCount(0, { timeout: 20_000 });
  await expect(page.locator('main mc-error-api [role="alert"], main .mc-falla')).toHaveCount(0);
}

test.describe('Farmacia', () => {
  test('aterriza en Circuitos y recorre sus pantallas sin errores', async ({ page }) => {
    await ingresar(page, cuentaFarmacia());
    await expect(page.getByRole('navigation', { name: 'Secciones' }).getByRole('link')).toHaveText([
      'Circuitos', 'Por recibir', 'Stock', 'Dispensar', 'Equipo',
    ]);
    await sinErroresDeCarga(page);
    // Solo la entrada de la pantalla actual queda resaltada ("Circuitos" es prefijo de las demás rutas).
    const actual = page.getByRole('navigation', { name: 'Secciones' }).locator('a[aria-current="page"]');
    await expect(actual).toHaveText(['Circuitos']);

    for (const [entrada, titulo] of [
      ['Por recibir', 'Por recibir'],
      ['Stock', 'Stock'],
      ['Dispensar', 'Dispensar'],
      ['Equipo', 'Equipo'],
    ]) {
      await irA(page, entrada);
      await expect(page.getByRole('heading', { level: 1, name: titulo })).toBeVisible();
      await expect(actual).toHaveText([entrada]);
      await sinErroresDeCarga(page);
    }
  });

  test('Stock: dos tarjetas, "En stock" y "En camino", cada una con sus cajas (o que no hay) y nunca el texto crudo de un enum', async ({ page }) => {
    await ingresar(page, cuentaFarmacia());
    await irA(page, 'Stock');

    for (const titulo of ['En stock', 'En camino']) {
      const tarjeta = page.locator('mc-lista-cajas', { has: page.getByRole('heading', { name: titulo }) });
      await expect(tarjeta.locator('tbody tr, .mc-vacio').first()).toBeVisible({ timeout: 20_000 });
      await expect(tarjeta).toContainText(/\d+ en total/);
    }
    await expect(page.locator('main')).not.toContainText(/EN_STOCK|EN_TRANSITO|DISPENSADA|EN_DEPOSITO/);
  });

  test('Dispensar: sin completar pide GTIN, serie y receta; no pide ni muestra datos de pacientes salvo el DNI opcional', async ({ page }) => {
    await ingresar(page, cuentaFarmacia());
    await irA(page, 'Dispensar');

    await page.getByRole('button', { name: 'Verificar y dispensar' }).click();

    await expect(page.getByText('Escribí el GTIN de la caja.')).toBeVisible();
    await expect(page.getByText('Escribí el número de serie de la caja.')).toBeVisible();
    await expect(page.getByText('Escribí el número de receta.')).toBeVisible();
    await expect(page.getByLabel('DNI del paciente (opcional)')).toBeVisible();
    await expect(page.locator('mc-formulario-dispensar')).not.toContainText(/nombre del paciente|apellido del paciente/i);
  });

  test('Dispensar: "pegar el código completo" completa GTIN y serie', async ({ page }) => {
    await ingresar(page, cuentaFarmacia());
    await irA(page, 'Dispensar');

    const pegado = page.getByLabel('Pegar el código completo (opcional)');
    await pegado.fill(`(01)${GTIN_DEMO}(21)L20260001S000001`);
    await pegado.press('Tab');

    await expect(page.getByLabel('GTIN', { exact: true })).toHaveValue(GTIN_DEMO);
    await expect(page.getByLabel('Número de serie')).toHaveValue('L20260001S000001');
  });

  test('Dispensar: una caja ya dispensada se informa con el 409 R11 de la API, tal cual (simulado)', async ({ page }) => {
    await page.route('**/api/dispensaciones', (ruta) =>
      ruta.request().method() === 'POST'
        ? ruta.fulfill({ status: 409, json: { status: 409, message: 'La caja ya fue dispensada', regla: 'R11', errors: null } })
        : ruta.continue(),
    );
    await ingresar(page, cuentaFarmacia());
    await irA(page, 'Dispensar');

    await page.getByLabel('GTIN', { exact: true }).fill(GTIN_DEMO);
    await page.getByLabel('Número de serie').fill('L20260001S000001');
    await page.getByLabel('Número de receta').fill('RX-E2E');
    await page.getByRole('checkbox', { name: /Particular/ }).check();
    await page.getByRole('button', { name: 'Verificar y dispensar' }).click();

    const formulario = page.locator('mc-formulario-dispensar');
    await expect(formulario.getByRole('alert')).toContainText('La caja ya fue dispensada');
    await expect(formulario.getByText('R11', { exact: true })).toBeVisible();
  });

  test('Por recibir: la farmacia ve el formulario de escaneo y sus actas', async ({ page }) => {
    await ingresar(page, cuentaFarmacia());
    await irA(page, 'Por recibir');

    await expect(page.getByRole('heading', { name: 'Escanear un bulto' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recepciones registradas' })).toBeVisible();
  });

  test('una farmacia no entra a las pantallas del laboratorio ni del paciente', async ({ page }) => {
    await ingresar(page, cuentaFarmacia());

    await page.goto('/laboratorio/lotes');
    await expect(page).toHaveURL(/\/farmacia$/);
    await page.goto('/paciente/reportes');
    await expect(page).toHaveURL(/\/farmacia$/);
  });
});

test.describe('Paciente', () => {
  test('aterriza en "Verificar un medicamento" con solo dos entradas de menú (no hay "Mis medicamentos", R13)', async ({ page }) => {
    await ingresar(page, cuentaPaciente());

    await expect(page.getByRole('heading', { level: 1, name: 'Verificar un medicamento' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Secciones' }).getByRole('link')).toHaveText(['Verificar un medicamento', 'Mis reportes']);
    await expect(page.getByRole('heading', { name: 'Reportar un problema con una caja' })).toBeVisible();
  });

  test('verifica una caja con su sesión y los datos pasan al formulario de reporte', async ({ page }) => {
    await ingresar(page, cuentaPaciente());

    await page.locator('mc-verificar').getByLabel('GTIN', { exact: true }).fill(GTIN_DEMO);
    await page.locator('mc-verificar').getByLabel('Número de serie').fill('NOEXISTE1');
    await page.locator('mc-verificar').getByRole('button', { name: 'Verificar' }).click();

    await expect(page.locator('mc-resultado-verificacion mc-estado')).toContainText('No existe');
    await expect(page.locator('mc-formulario-reporte').getByLabel('GTIN', { exact: true })).toHaveValue(GTIN_DEMO);
    await expect(page.locator('mc-formulario-reporte').getByLabel('Número de serie')).toHaveValue('NOEXISTE1');
  });

  test('el reporte sin completar pide qué pasó y la provincia, sin llamar a la API', async ({ page }) => {
    await ingresar(page, cuentaPaciente());

    await page.getByRole('button', { name: 'Enviar reporte' }).click();

    await expect(page.getByText('Elegí qué pasó.')).toBeVisible();
    await expect(page.getByText('Elegí la provincia donde la conseguiste.')).toBeVisible();
  });

  test('"Mis reportes" carga la lista propia sin acciones de inspector', async ({ page }) => {
    await ingresar(page, cuentaPaciente());
    await irA(page, 'Mis reportes');

    await expect(page.getByRole('heading', { level: 1, name: 'Mis reportes' })).toBeVisible();
    await sinErroresDeCarga(page);
    await expect(page.getByRole('button', { name: /Tomar el caso|Cerrar caso/ })).toHaveCount(0);
  });

  test('un paciente no entra a las pantallas de farmacia ni a las de inspector', async ({ page }) => {
    await ingresar(page, cuentaPaciente());

    await page.goto('/farmacia/stock');
    await expect(page).toHaveURL(/\/paciente$/);
    await page.goto('/inspector/reportes');
    await expect(page).toHaveURL(/\/paciente$/);
  });
});
