import { expect, test } from '@playwright/test';
import { cuentaPaciente } from '../soporte/cuentas';
import { sufijoUnico } from '../soporte/identificadores';
import { ingresar } from '../soporte/ingreso';
import { elegirOpcion } from '../soporte/selectores';
import { GTIN_DEMO } from '../soporte/verificacion';

// e2e de FLUJO: MODIFICA DATOS. Lo corre SOLO el autor, a mano (ver CLAUDE.md).
//
// Cada corrida deja UN reporte ciudadano nuevo (de una serie que no existe, con serie única)
// en la bandeja de los inspectores de Mendoza. No necesita reset-demo.sh.

test.describe('reporte del paciente', () => {
  test('reporta una caja inexistente y el reporte aparece en "Mis reportes" abierto', async ({ page }) => {
    const serie = `E2E${sufijoUnico()}`.toUpperCase();
    await ingresar(page, cuentaPaciente());

    const formulario = page.locator('mc-formulario-reporte');
    await formulario.getByLabel('GTIN', { exact: true }).fill(GTIN_DEMO);
    await formulario.getByLabel('Número de serie').fill(serie);
    await elegirOpcion(page, formulario.getByRole('combobox', { name: 'Qué pasó' }), 'Sospecha de falsificación');
    await elegirOpcion(page, formulario.getByRole('combobox', { name: 'Provincia donde la conseguiste' }), 'Mendoza');
    await formulario.getByLabel(/Contanos qué viste/).fill('Reporte automático de prueba (e2e)');
    await formulario.getByRole('button', { name: 'Enviar reporte' }).click();

    await expect(formulario.getByRole('status')).toContainText(/Reporte REP-\d+ enviado/);

    await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Mis reportes' }).click();
    const fila = page.locator('tbody tr', { hasText: serie });
    await expect(fila, 'el reporte nuevo debería estar en la primera página de "Mis reportes"').toBeVisible({ timeout: 20_000 });
    await expect(fila.locator('mc-estado')).toContainText('Abierto');
  });
});
