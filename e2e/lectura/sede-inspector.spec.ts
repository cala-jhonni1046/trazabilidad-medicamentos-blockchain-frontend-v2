import { Page, expect, test } from '@playwright/test';
import { cuentaInspector, cuentaSede } from '../soporte/cuentas';
import { ingresar } from '../soporte/ingreso';

// e2e de LECTURA: pantallas de la Sede y del inspector. Solo miran (las acciones que modifican
// datos están cubiertas por los tests unitarios y por e2e/flujo). Los casos que no se pueden
// provocar de verdad (blockchain alterada, 409/503 al anclar) se simulan con page.route:
// esas respuestas simuladas nunca llegan al backend ni a la blockchain.

/** Va a una entrada del menú lateral. */
async function irA(page: Page, entrada: string): Promise<void> {
  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: entrada }).click();
}

/** La pantalla cargó sin dejar un error de la API a la vista. */
async function sinErroresDeCarga(page: Page): Promise<void> {
  await expect(page.locator('main').getByText(/Cargando…|Consultando la red…/)).toHaveCount(0);
  await expect(page.locator('main mc-error-api [role="alert"], main .mc-falla')).toHaveCount(0);
}

test.describe('Sede', () => {
  test('recorre sus pantallas y cada una carga sin errores', async ({ page }) => {
    await ingresar(page, cuentaSede());
    const menu = page.getByRole('navigation', { name: 'Secciones' });
    await expect(menu.getByRole('link')).toHaveText(['Tablero', 'Inspectores', 'Empresas', 'Circuitos', 'Cadena y Sepolia', 'Usuarios']);

    for (const [entrada, titulo] of [
      ['Inspectores', 'Inspectores'],
      ['Empresas', 'Empresas'],
      ['Circuitos', 'Circuitos'],
      ['Cadena y Sepolia', 'Cadena y Sepolia'],
      ['Usuarios', 'Usuarios'],
    ]) {
      await irA(page, entrada);
      await expect(page.getByRole('heading', { level: 1, name: titulo })).toBeVisible();
      await expect(page.locator('mc-tarjeta').first()).toBeVisible();
      await sinErroresDeCarga(page);
    }
  });

  test('inspectores: la demo tiene al menos un inspector activo con su legajo', async ({ page }) => {
    await ingresar(page, cuentaSede());
    await irA(page, 'Inspectores');

    await expect(page.locator('tbody tr').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dar de alta' })).toBeVisible();
    await expect(page.locator('tbody mc-estado', { hasText: 'Activo' }).first()).toBeVisible();
  });

  test('cadena: muestra el estado, verifica la cadena y lista los eventos con su tipo en español', async ({ page }) => {
    await ingresar(page, cuentaSede());
    await irA(page, 'Cadena y Sepolia');

    await expect(page.getByText('Último evento local')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Anclar ya' })).toBeVisible();
    await expect(page.locator('mc-tarjeta', { hasText: 'Eventos de la cadena' }).locator('tbody tr').first()).toBeVisible();
    // Ningún tipo de evento se muestra con el código crudo (por ejemplo LOTE_REGISTRADO).
    await expect(page.locator('mc-tarjeta', { hasText: 'Eventos de la cadena' }).locator('tbody')).not.toContainText(/[A-Z]+_[A-Z_]+/);

    await page.getByRole('button', { name: 'Verificar ahora' }).click();
    await expect(page.locator('.informe')).toBeVisible();
  });

  test('cadena: una blockchain ALTERADA se muestra como crítica con el rango (simulado)', async ({ page }) => {
    await page.route('**/api/eventos-trazabilidad/verificacion', (ruta) =>
      ruta.fulfill({
        json: {
          integra: true, eventosVerificados: 40, resumen: 'La base parece íntegra pero no coincide con Sepolia',
          blockchain: { estado: 'ALTERADA', alteradoDesde: 12, alteradoHasta: 14, anclajesVerificados: 3 },
        },
      }),
    );
    await ingresar(page, cuentaSede());
    await irA(page, 'Cadena y Sepolia');

    await page.getByRole('button', { name: 'Verificar ahora' }).click();

    const informe = page.locator('.informe');
    await expect(informe).toContainText('La base parece íntegra pero no coincide con Sepolia');
    await expect(informe.locator('mc-estado')).toContainText('Alterada');
    await expect(informe).toContainText('eventos #12 a #14');
  });

  test('cadena: "Anclar ya" con un 409 de la API lo muestra tal cual dentro del diálogo (simulado)', async ({ page }) => {
    await page.route('**/api/registros-blockchain/anclar', (ruta) =>
      ruta.fulfill({ status: 409, json: { status: 409, message: 'No hay eventos nuevos para anclar', regla: 'SIN_EVENTOS_NUEVOS', errors: null } }),
    );
    await ingresar(page, cuentaSede());
    await irA(page, 'Cadena y Sepolia');

    await page.getByRole('button', { name: 'Anclar ya' }).click();
    const dialogo = page.getByRole('dialog');
    await expect(dialogo).toContainText('Anclar ahora en Sepolia');
    await dialogo.getByRole('button', { name: 'Anclar ahora' }).click();

    await expect(dialogo.getByRole('alert')).toContainText('No hay eventos nuevos para anclar');
    await expect(dialogo.getByText('SIN_EVENTOS_NUEVOS')).toBeVisible();
    await dialogo.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialogo).toBeHidden();
  });

  test('cadena: un anclaje aceptado (202) se sigue hasta CONFIRMADO (simulado)', async ({ page }) => {
    const anclaje = (estado: string, confirmaciones: number) => ({
      id: 'a1', desdeNumero: 1, hastaNumero: 9, hashAnclado: 'ab'.repeat(32), estado, confirmaciones, red: 'Sepolia', transactionHash: '0x' + 'cd'.repeat(32),
      enlaceEtherscan: 'https://sepolia.etherscan.io/tx/0x' + 'cd'.repeat(32), intentos: 1, version: 0, fechaCreacion: '2026-10-08T18:00:00Z', fechaActualizacion: '2026-10-08T18:00:00Z',
    });
    await page.route('**/api/registros-blockchain/anclar', (ruta) => ruta.fulfill({ status: 202, json: anclaje('ENVIADO', 0) }));
    await page.route('**/api/registros-blockchain/a1', (ruta) => ruta.fulfill({ json: anclaje('CONFIRMADO', 3) }));
    await ingresar(page, cuentaSede());
    await irA(page, 'Cadena y Sepolia');

    await page.getByRole('button', { name: 'Anclar ya' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Anclar ahora' }).click();

    const seguimiento = page.locator('.seguimiento');
    await expect(seguimiento).toContainText('Anclaje enviado');
    await expect(seguimiento).toContainText('Confirmado', { timeout: 15_000 });
    await expect(seguimiento).toContainText('3 confirmaciones');
  });
});

/**
 * La insignia del menú (GET /api/tablero/bandeja-inspector) es el mismo número que "N en total" (o "N pendientes") de la tarjeta de
 * esa bandeja; con cero pendientes no hay insignia.
 */
async function insigniaIgualAlTotal(page: Page, entrada: string, tarjeta: string): Promise<void> {
  const enlace = page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: new RegExp(`^${entrada}`) });
  const detalle = await page.locator('mc-tarjeta', { has: page.getByRole('heading', { name: tarjeta }) }).textContent();
  const total = Number(/(\d[\d.]*) (?:en total|pendientes)/.exec(detalle ?? '')?.[1]?.replaceAll('.', '') ?? NaN);
  expect(Number.isNaN(total), `la tarjeta "${tarjeta}" dice cuántos hay`).toBe(false);
  if (total === 0) {
    await expect(enlace.locator('.insignia')).toHaveCount(0);
  } else {
    await expect(enlace.locator('.insignia')).toContainText(String(total));
  }
}

test.describe('Inspector', () => {
  test('aterriza en su bandeja con los cinco listados y recorre sus pantallas', async ({ page }) => {
    await ingresar(page, cuentaInspector());

    await expect(page.getByRole('heading', { level: 1, name: 'Pendientes de tu acción' })).toBeVisible();
    for (const titulo of ['Empresas por habilitar', 'Circuitos por aprobar', 'Biológicos por liberar', 'Cuarentenas por revisar', 'Reportes ciudadanos']) {
      await expect(page.locator('mc-tarjeta').getByRole('heading', { name: titulo })).toBeVisible();
    }
    // Cada entrada puede traer su insignia de pendientes ("3 pendientes"): se compara solo el comienzo.
    await expect(page.getByRole('navigation', { name: 'Secciones' }).getByRole('link')).toHaveText([
      /^Bandeja/, /^Empresas/, /^Circuitos/, /^Lotes y cuarentenas/, /^Reportes/, /^Cadena y Sepolia/,
    ]);
    await sinErroresDeCarga(page);
    await insigniaIgualAlTotal(page, 'Empresas', 'Empresas por habilitar');
    await insigniaIgualAlTotal(page, 'Circuitos', 'Circuitos por aprobar');
    await insigniaIgualAlTotal(page, 'Reportes', 'Reportes ciudadanos');

    for (const [entrada, titulo] of [
      ['Empresas', 'Empresas'],
      ['Circuitos', 'Circuitos'],
      ['Lotes y cuarentenas', 'Lotes y cuarentenas'],
      ['Reportes', 'Reportes ciudadanos'],
      ['Cadena y Sepolia', 'Cadena y Sepolia'],
    ]) {
      await irA(page, entrada);
      await expect(page.getByRole('heading', { level: 1, name: titulo })).toBeVisible();
      await sinErroresDeCarga(page);
    }
  });

  test('en "Cadena y Sepolia" puede verificar pero no ve "Anclar ya"', async ({ page }) => {
    await ingresar(page, cuentaInspector());
    await irA(page, 'Cadena y Sepolia');

    await expect(page.getByRole('button', { name: 'Verificar ahora' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Anclar ya' })).toHaveCount(0);
  });

  test('un inspector no entra a las pantallas de la Sede', async ({ page }) => {
    await ingresar(page, cuentaInspector());

    await page.goto('/sede/inspectores');

    await expect(page).toHaveURL(/\/inspector$/);
  });

  test('los lotes de la demo muestran su medicamento y el estado con color, ícono y texto', async ({ page }) => {
    await ingresar(page, cuentaInspector());
    await irA(page, 'Lotes y cuarentenas');

    const lotes = page.locator('mc-tarjeta', { hasText: 'Lotes' }).first();
    await expect(lotes.locator('tbody tr').first()).toBeVisible();
    await expect(lotes.locator('tbody mc-estado mat-icon').first()).toBeVisible();
    await expect(lotes.locator('tbody')).not.toContainText('(sin datos)');
  });
});
