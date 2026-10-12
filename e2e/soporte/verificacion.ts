import { Page, expect } from '@playwright/test';

/** GTIN del medicamento de la demo (Cuyafen) y una serie que sí existe en la demo. */
export const GTIN_DEMO = '07799000001010';
export const SERIE_DEMO = 'L20260001S000001';

/** Los textos de estado que puede mostrar la verificación (catálogo de estados). */
export const TEXTOS_ESTADO_VERIFICACION = [
  'Apta',
  'Ya dispensada',
  'Bloqueada',
  'Robada',
  'En distribución',
  'No existe',
] as const;

/** Escribe GTIN y serie y envía el formulario de /verificar. */
export async function verificarCaja(page: Page, gtin: string, serie: string): Promise<void> {
  await page.goto('/verificar');
  await page.getByLabel('GTIN', { exact: true }).fill(gtin);
  await page.getByLabel('Número de serie').fill(serie);
  await page.getByRole('button', { name: 'Verificar' }).click();
  await expect(page.locator('mc-resultado-verificacion, .mat-mdc-form-field-error').first()).toBeVisible();
}
