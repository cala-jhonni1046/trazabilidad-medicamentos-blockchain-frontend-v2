import { expect, test } from '@playwright/test';
import { cuentaFarmaciaDelParque } from '../soporte/cuentas';
import { ingresar } from '../soporte/ingreso';
import { elegirOpcion } from '../soporte/selectores';

// e2e de FLUJO: MODIFICA DATOS. Lo corre SOLO el autor, a mano (ver CLAUDE.md).
//
// Cada corrida DEVUELVE una caja EN_STOCK de la Farmacia del Parque (cadena nueva de la demo, lote
// L2026-0010): la caja pasa a DEVUELTA y no vuelve a dispensarse. La demo trae 4 cajas en stock, así que
// después de 4 corridas no queda ninguna: hace falta `~/con-blockchain/reset-demo.sh`. Si no encuentra cajas
// en stock, aborta con un mensaje claro.

test.describe('devolución de una caja en la farmacia', () => {
  test('la Farmacia del Parque devuelve una caja en stock y sale de "En stock"', async ({ page }) => {
    await ingresar(page, cuentaFarmaciaDelParque());
    await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Stock', exact: true }).click();

    const enStock = page.locator('mc-lista-cajas', { has: page.getByRole('heading', { name: 'En stock' }) });
    await expect(enStock).toContainText(/\d+ en total/, { timeout: 20_000 });
    const antes = Number(/(\d+) en total/.exec((await enStock.textContent()) ?? '')?.[1]);
    expect(antes, 'la Farmacia del Parque no tiene cajas en stock: corré ~/con-blockchain/reset-demo.sh y reiniciá el backend').toBeGreaterThan(0);

    await enStock.getByRole('button', { name: /Devolver/ }).first().click();
    const dialogo = page.getByRole('dialog');
    await elegirOpcion(page, dialogo.getByRole('combobox', { name: 'Motivo' }), 'Caja dañada');
    await dialogo.getByLabel('Observación').fill('Devolución automática de prueba (e2e)');
    await dialogo.getByRole('button', { name: 'Devolver', exact: true }).click();

    await expect(dialogo).toBeHidden();
    // El texto del aviso trae un espacio al principio (plantilla de Material): por eso no se ancla con ^.
    await expect(page.locator('.mat-mdc-snack-bar-label').getByText(/devuelta/)).toBeVisible();
    await expect(enStock).toContainText(`${antes - 1} en total`);
  });
});
