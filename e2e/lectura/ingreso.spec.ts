import { expect, test } from '@playwright/test';
import { CUENTAS_POR_ROL, cuentaFarmacia } from '../soporte/cuentas';
import { completarIngreso, ingresar } from '../soporte/ingreso';

// e2e de LECTURA: no modifican datos del backend (el login solo actualiza "último ingreso").

test.describe('ingreso', () => {
  test('sin sesión, la raíz lleva a ingresar', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/ingresar$/);
    await expect(page.getByRole('heading', { name: 'Ingresar' })).toBeVisible();
  });

  test('con los campos vacíos muestra un error por campo y sigue en ingresar', async ({ page }) => {
    await page.goto('/ingresar');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page.getByText('Escribí tu correo electrónico.')).toBeVisible();
    await expect(page.getByText('Escribí tu contraseña.')).toBeVisible();
    await expect(page).toHaveURL(/\/ingresar$/);
  });

  test('credenciales inválidas: mensaje de la API arriba del formulario, sin salir de ingresar', async ({ page }) => {
    await page.goto('/ingresar');
    await completarIngreso(page, 'nadie@ejemplo.com', 'clave-incorrecta');

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/ingresar$/);
  });

  for (const obtenerCuenta of CUENTAS_POR_ROL) {
    test(`una cuenta de ${obtenerCuenta.name.replace('cuenta', '') || 'rol'} ingresa a su inicio`, async ({ page }) => {
      const cuenta = obtenerCuenta();
      await ingresar(page, cuenta);

      await expect(page.locator('.lateral .rol')).toHaveText(cuenta.rotulo);
      await expect(page.getByRole('navigation', { name: 'Secciones' })).toContainText('Inicio');
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Hola,');
    });
  }

  test('una ruta de otro rol lleva al inicio del propio', async ({ page }) => {
    await ingresar(page, cuentaFarmacia());

    await page.goto('/sede');

    await expect(page).toHaveURL(/\/farmacia$/);
  });

  test('con sesión, la pantalla de ingreso lleva al inicio del rol', async ({ page }) => {
    await ingresar(page, cuentaFarmacia());

    await page.goto('/ingresar');

    await expect(page).toHaveURL(/\/farmacia$/);
  });

  test('pedir una ruta con sesión cerrada vuelve a ella después de ingresar', async ({ page }) => {
    const cuenta = cuentaFarmacia();
    await page.goto('/farmacia');
    await expect(page).toHaveURL(/\/ingresar\?volver=%2Ffarmacia$/);

    await completarIngreso(page, cuenta.email, cuenta.password);

    await expect(page).toHaveURL(/\/farmacia$/);
  });
});
