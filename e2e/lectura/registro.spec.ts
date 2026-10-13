import AxeBuilder from '@axe-core/playwright';
import { Page, expect, test } from '@playwright/test';
import { cuentaFarmacia } from '../soporte/cuentas';
import { ingresar } from '../soporte/ingreso';
import { elegirOpcion } from '../soporte/selectores';

// e2e de LECTURA: las pantallas públicas de registro (empresa y paciente). Solo validan y miran: el registro
// de verdad (que crea datos) está en e2e/flujo/registro-empresa.spec.ts. Cualquier envío se simula con page.route.

async function sinViolaciones(page: Page): Promise<void> {
  const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(resultado.violations.map((v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`), 'violaciones de accesibilidad').toEqual([]);
}

test.describe('registro público', () => {
  test('desde ingresar se llega a las dos pantallas de registro', async ({ page }) => {
    await page.goto('/ingresar');

    await page.getByRole('link', { name: 'Registrá tu empresa' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Registrar una empresa' })).toBeVisible();
    await page.goto('/ingresar');
    await page.getByRole('link', { name: 'creá tu cuenta de paciente' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Crear mi cuenta de paciente' })).toBeVisible();
  });

  test('empresa: sin completar pide cada dato y el PDF, y no manda nada a la API', async ({ page }) => {
    let enviados = 0;
    await page.route('**/api/registro/empresas', (ruta) => {
      enviados++;
      return ruta.abort();
    });
    await page.goto('/registrar-empresa');

    await page.getByRole('button', { name: 'Enviar la solicitud' }).click();

    await expect(page.getByText('Elegí qué tipo de empresa es.')).toBeVisible();
    await expect(page.getByText('Escribí el CUIT.')).toBeVisible();
    await expect(page.getByText('Elegí el PDF de la habilitación.')).toBeVisible();
    expect(enviados).toBe(0);
  });

  test('empresa: un 409 de la API (CUIT repetido, simulado) se ve arriba con su código', async ({ page }) => {
    await page.route('**/api/registro/empresas', (ruta) =>
      ruta.fulfill({ status: 409, json: { status: 409, message: 'Ya hay una empresa con ese CUIT', regla: 'EMPRESA_DUPLICADA', errors: null } }),
    );
    await page.goto('/registrar-empresa');
    await elegirOpcion(page, page.getByRole('combobox', { name: 'Tipo de empresa' }), 'Farmacia');
    await page.getByLabel('Razón social').fill('Farmacia simulada');
    await page.getByLabel('CUIT').fill('30-71000010-3');
    await page.getByLabel('GLN').fill('7799000001058');
    await elegirOpcion(page, page.getByRole('combobox', { name: 'Provincia' }), 'Mendoza');
    await page.getByLabel('Localidad').fill('Mendoza');
    await page.getByLabel('Domicilio').fill('Calle 1');
    await page.getByLabel('PDF de la habilitación').setInputFiles({ name: 'h.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF\n') });
    await page.getByLabel('Nombre', { exact: true }).fill('Prueba');
    await page.getByLabel('Apellido').fill('Simulada');
    await page.getByLabel('DNI').fill('30111007');
    await page.getByLabel('Correo electrónico').fill('simulada@e2e.test');
    await page.getByLabel('Contraseña').fill('Clave-Simulada-1');
    await page.getByRole('button', { name: 'Enviar la solicitud' }).click();

    await expect(page.locator('mc-error-api [role="alert"]')).toContainText('Ya hay una empresa con ese CUIT');
    await expect(page.locator('mc-error-api')).toContainText('EMPRESA_DUPLICADA');
  });

  test('paciente: sin completar pide los datos y no manda nada a la API', async ({ page }) => {
    let enviados = 0;
    await page.route('**/api/registro/pacientes', (ruta) => {
      enviados++;
      return ruta.abort();
    });
    await page.goto('/registrar-paciente');

    await page.getByRole('button', { name: 'Crear mi cuenta' }).click();

    await expect(page.getByText('Escribí tu DNI.')).toBeVisible();
    await expect(page.getByText('Escribí tu contraseña.').or(page.getByText('Escribí una contraseña.'))).toBeVisible();
    expect(enviados).toBe(0);
  });

  test('quien ya tiene sesión no ve las pantallas de registro: va a su inicio', async ({ page }) => {
    await ingresar(page, cuentaFarmacia());

    await page.goto('/registrar-empresa');
    await expect(page).toHaveURL(/\/farmacia$/);
    await page.goto('/registrar-paciente');
    await expect(page).toHaveURL(/\/farmacia$/);
  });

  for (const modo of ['light', 'dark'] as const) {
    test.describe(`accesibilidad · modo ${modo}`, () => {
      test.use({ colorScheme: modo });

      test('registrar una empresa (con errores de validación)', async ({ page }) => {
        await page.goto('/registrar-empresa');
        await page.getByRole('button', { name: 'Enviar la solicitud' }).click();
        await expect(page.getByText('Escribí el CUIT.')).toBeVisible();
        // Los mensajes de error de Material aparecen con una transición: axe los mediría a medio camino.
        await page.waitForFunction(() => Array.from(document.querySelectorAll('mat-error')).every((e) => getComputedStyle(e).opacity === '1'));
        await sinViolaciones(page);
      });

      test('crear mi cuenta de paciente', async ({ page }) => {
        await page.goto('/registrar-paciente');
        await expect(page.getByRole('heading', { level: 1, name: 'Crear mi cuenta de paciente' })).toBeVisible();
        await sinViolaciones(page);
      });
    });
  }
});
