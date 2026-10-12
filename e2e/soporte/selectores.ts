import { Locator, Page, expect } from '@playwright/test';

/**
 * Elige una opción de un `mat-select` y espera a que su panel se cierre del todo.
 * Sin esa espera, el telón (backdrop) del panel que se está cerrando intercepta el clic siguiente.
 *
 * El clic va al `mat-form-field`, como el de una persona: con una etiqueta larga, el `<mat-label>`
 * (que Material deja con `pointer-events: all`) tapa el centro del combobox y Playwright no lo da
 * por clicable. En el navegador el clic sobre la etiqueta sube al campo y abre el panel igual.
 *
 * @param page Página de Playwright.
 * @param campo El combobox del `mat-select` (por ejemplo, `dialogo.getByRole('combobox', { name: 'Inspector' })`).
 * @param opcion Texto de la opción, o una expresión regular; si se omite, elige la primera.
 */
export async function elegirOpcion(page: Page, campo: Locator, opcion?: string | RegExp): Promise<void> {
  await campo.locator('xpath=ancestor::mat-form-field').click();
  const opciones = page.getByRole('option');
  await (opcion === undefined ? opciones.first() : page.getByRole('option', { name: opcion })).click();
  await expect(page.getByRole('listbox')).toBeHidden();
}
