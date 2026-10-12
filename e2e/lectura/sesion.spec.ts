import { expect, test } from '@playwright/test';
import { cuentaFarmacia } from '../soporte/cuentas';
import { ingresar } from '../soporte/ingreso';

// e2e de LECTURA: sesión (recarga, salir, vencimiento, rechazo) y tema.

test.describe('sesión', () => {
  test('recargar la página mantiene la sesión', async ({ page }) => {
    await ingresar(page, cuentaFarmacia());

    await page.reload();

    await expect(page).toHaveURL(/\/farmacia$/);
    await expect(page.locator('.lateral .rol')).toHaveText('Farmacia');
  });

  test('Salir vuelve a ingresar, y "Atrás" no vuelve a entrar', async ({ page }) => {
    await ingresar(page, cuentaFarmacia());

    await page.getByRole('button', { name: 'Salir' }).click();
    await expect(page).toHaveURL(/\/ingresar$/);

    await page.goBack();
    await expect(page).toHaveURL(/\/ingresar/);
    await expect(page.getByRole('heading', { name: 'Ingresar' })).toBeVisible();
  });

  test('al llegar a la hora de vencimiento la sesión termina y lo explica', async ({ page }) => {
    // El reloj corre normal; el token dura 8 horas, así que se adelanta 9.
    await page.clock.install();
    await ingresar(page, cuentaFarmacia());

    await page.clock.fastForward('09:00:00');

    await expect(page).toHaveURL(/\/ingresar\?motivo=vencida/);
    await expect(page.getByRole('status').filter({ hasText: 'Tu sesión venció' })).toBeVisible();
  });

  test('un 401 de la API cierra la sesión y lo explica', async ({ page }) => {
    // Simula una cuenta desactivada: la lectura de la empresa del shell responde 401.
    await page.route(/\/api\/empresas\/[^/?]+$/, (ruta) =>
      ruta.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ status: 401, message: 'No autenticado', regla: null, errors: null }),
      }),
    );

    const cuenta = cuentaFarmacia();
    await page.goto('/ingresar');
    await page.getByLabel('Correo electrónico').fill(cuenta.email);
    await page.getByLabel('Contraseña').fill(cuenta.password);
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page).toHaveURL(/\/ingresar\?motivo=rechazada/);
    await expect(page.getByRole('status').filter({ hasText: 'ya no es válida' })).toBeVisible();
  });

  test('el aviso de empresa no habilitada muestra el estado que devuelve la API y no bloquea el menú', async ({ page }) => {
    await page.route(/\/api\/empresas\/[^/?]+$/, async (ruta) => {
      const respuesta = await ruta.fetch();
      const empresa = (await respuesta.json()) as Record<string, unknown>;
      await ruta.fulfill({ response: respuesta, json: { ...empresa, estado: 'SUSPENDIDA' } });
    });

    await ingresar(page, cuentaFarmacia());

    await expect(page.locator('mc-aviso-empresa').getByRole('status')).toContainText('suspendida');
    await expect(page.getByRole('navigation', { name: 'Secciones' })).toContainText('Circuitos');
  });
});

test.describe('tema', () => {
  test('elegir Oscuro pone data-theme="dark" y se recuerda al recargar', async ({ page }) => {
    await page.goto('/ingresar');

    // El selector es un grupo de selección única: Material lo expone como radiogroup con radios.
    const oscuro = page.getByRole('radiogroup', { name: 'Tema de colores' }).getByRole('radio', { name: 'Oscuro' });
    await oscuro.click();
    await expect(oscuro).toBeChecked();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});
