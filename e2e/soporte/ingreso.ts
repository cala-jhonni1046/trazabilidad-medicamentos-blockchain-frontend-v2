import { Page, expect } from '@playwright/test';
import { Cuenta } from './cuentas';

/** Escribe las credenciales en la pantalla de ingreso y envía el formulario. */
export async function completarIngreso(page: Page, email: string, password: string): Promise<void> {
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
}

/** Ingresa con la cuenta y espera a llegar a su inicio. */
export async function ingresar(page: Page, cuenta: Cuenta): Promise<void> {
  await page.goto('/ingresar');
  await completarIngreso(page, cuenta.email, cuenta.password);
  await expect(page).toHaveURL(cuenta.inicio);
}
