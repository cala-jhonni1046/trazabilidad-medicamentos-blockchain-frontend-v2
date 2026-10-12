import { expect, test } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import { cuentaLaboratorio } from '../soporte/cuentas';
import { ingresar } from '../soporte/ingreso';
import { elegirOpcion } from '../soporte/selectores';

// e2e de FLUJO: MODIFICA DATOS. Lo corre SOLO el autor, a mano (ver CLAUDE.md).
//
// Cada corrida registra UN lote nuevo de 5 cajas en la demo (código único) y, si la cuenta del
// laboratorio es director técnico, lo libera. Deja un lote más (y sus 5 series) en la base: no
// necesita reset-demo.sh, pero la base se va llenando.
//
// El lote se registra con un medicamento COMÚN (no biológico): la API no deja que el director
// técnico libere un biológico (409 R4; lo libera un inspector), así que el test busca uno en
// "Medicamentos" y falla con un mensaje claro si el laboratorio no tiene ninguno.

/** Hoy y dentro de dos años, como YYYY-MM-DD (lo que entiende <input type="date">). */
function fechas(): { hoy: string; vence: string } {
  const hoy = new Date();
  const vence = new Date(hoy.getFullYear() + 2, hoy.getMonth(), hoy.getDate());
  const dia = (f: Date) => `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
  return { hoy: dia(hoy), vence: dia(vence) };
}

test.describe('lote del laboratorio', () => {
  test('registra un lote, queda pendiente de liberación y el director técnico lo libera', async ({ page }) => {
    const codigo = `E${randomBytes(4).toString('hex')}`.slice(0, 9).toUpperCase();
    const { hoy, vence } = fechas();
    await ingresar(page, cuentaLaboratorio());
    const menu = page.getByRole('navigation', { name: 'Secciones' });

    // GTIN de un medicamento común: la tabla marca los biológicos con "· biológico".
    await menu.getByRole('link', { name: 'Medicamentos', exact: true }).click();
    const comun = page.locator('tbody tr', { hasNotText: 'biológico' }).first();
    await expect(comun, 'el laboratorio necesita un medicamento común (no biológico) para este test').toBeVisible();
    const gtin = (await comun.locator('code').first().innerText()).trim();

    await menu.getByRole('link', { name: 'Lotes', exact: true }).click();

    await page.getByRole('button', { name: 'Registrar un lote' }).click();
    const dialogo = page.getByRole('dialog');
    await elegirOpcion(page, dialogo.getByRole('combobox', { name: 'Medicamento' }), new RegExp(`GTIN ${gtin}`));
    await dialogo.getByLabel('Código del lote').fill(codigo);
    await dialogo.getByLabel('Fecha de fabricación').fill(hoy);
    await dialogo.getByLabel('Fecha de vencimiento').fill(vence);
    await dialogo.getByLabel('Cantidad de cajas').fill('5');
    await dialogo.getByRole('button', { name: 'Registrar lote' }).click();

    await expect(dialogo).toBeHidden();
    const fila = page.locator('tbody tr', { hasText: codigo });
    await expect(fila, 'el lote nuevo debería aparecer en la primera página (si hay muchos lotes, buscalo en las siguientes)').toBeVisible();
    await expect(fila.locator('mc-estado')).toContainText('Pendiente de liberación');

    // Solo el director técnico libera un lote común (R4): si la cuenta no lo es, no hay botón.
    const liberar = fila.getByRole('button', { name: /Liberar/ });
    if ((await liberar.count()) > 0) {
      await liberar.click();
      await page.getByRole('dialog').getByRole('button', { name: 'Liberar', exact: true }).click();
      await expect(page.getByRole('dialog')).toBeHidden();
      await expect(page.locator('tbody tr', { hasText: codigo }).locator('mc-estado')).toContainText('Liberado');
    }
  });
});
