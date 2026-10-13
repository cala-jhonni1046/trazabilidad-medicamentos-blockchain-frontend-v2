import { expect, test } from '@playwright/test';
import { cuentaFarmacia, cuentaSede } from '../soporte/cuentas';
import { ingresar } from '../soporte/ingreso';

// e2e de LECTURA: tablero de la Sede (solo mira; la asignación está en e2e/flujo).

const MOSAICOS = [
  'Empresas',
  'Empresas pendientes',
  'Inspectores activos',
  'Circuitos aprobados',
  'Cuarentenas activas',
  'Eventos en la cadena',
  'Anclajes confirmados en Sepolia',
];

test.describe('tablero de la Sede', () => {
  test('la Sede aterriza en el tablero con sus 7 mosaicos numéricos', async ({ page }) => {
    await ingresar(page, cuentaSede());

    await expect(page.getByRole('heading', { level: 1, name: 'Tablero' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Secciones' })).toContainText('Tablero');
    const mosaicos = page.locator('mc-mosaico');
    await expect(mosaicos).toHaveCount(7);
    await expect(mosaicos.locator('.etiqueta')).toHaveText(MOSAICOS);
    // Cada valor termina siendo un número (con puntos de miles): ni "…" ni "—".
    for (const valor of await mosaicos.locator('.valor').all()) {
      await expect(valor).toHaveText(/^\s*\d[\d.]*\s*$/);
    }
  });

  test('muestra las dos listas de pendientes: con elementos o con su texto de "no hay"', async ({ page }) => {
    await ingresar(page, cuentaSede());

    for (const [titulo, vacio] of [
      ['Solicitudes de habilitación sin inspector', 'No hay solicitudes sin inspector.'],
      ['Circuitos sin inspector', 'No hay circuitos sin inspector.'],
    ]) {
      const tarjeta = page.locator('mc-tarjeta', { has: page.getByRole('heading', { name: titulo }) });
      await expect(tarjeta).toBeVisible();
      await expect(tarjeta.locator('.pendientes li, .vacio').first()).toBeVisible();
      const hay = await tarjeta.locator('.pendientes li').count();
      if (hay === 0) {
        await expect(tarjeta).toContainText(vacio);
      }
    }
  });

  test('"Actualizar" vuelve a cargar y los mosaicos siguen siendo numéricos', async ({ page }) => {
    await ingresar(page, cuentaSede());
    await expect(page.locator('mc-mosaico .valor').first()).toHaveText(/^\s*\d[\d.]*\s*$/);

    await page.getByRole('button', { name: 'Actualizar' }).click();

    for (const valor of await page.locator('mc-mosaico .valor').all()) {
      await expect(valor).toHaveText(/^\s*\d[\d.]*\s*$/);
    }
  });

  test('una farmacia que pide el tablero no lo ve: termina en su inicio', async ({ page }) => {
    await ingresar(page, cuentaFarmacia());

    await page.goto('/sede');

    await expect(page).toHaveURL(/\/farmacia$/);
    await expect(page.locator('mc-mosaico')).toHaveCount(0);
  });
});
