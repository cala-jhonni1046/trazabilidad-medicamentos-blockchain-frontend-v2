import { expect, test } from '@playwright/test';
import { cuentaSede } from '../soporte/cuentas';
import { contrasenaDeUnaVez, cuitUnico, dniAlAzar, glnUnico, sufijoUnico } from '../soporte/identificadores';
import { ingresar } from '../soporte/ingreso';
import { elegirOpcion } from '../soporte/selectores';

// e2e de FLUJO: MODIFICA DATOS. Lo corre SOLO el autor, a mano (ver CLAUDE.md).
//
// Cada corrida REGISTRA una empresa nueva desde la pantalla pública (una farmacia de SALTA, con su
// administrador y un PDF mínimo) y comprueba que llega a la bandeja de la Sede. Deja una empresa PENDIENTE
// (sin asignar) más en la base: no necesita reset-demo.sh, pero la base se va llenando. Necesita que SALTA
// no tenga inspectores activos (como en la demo): si no, la solicitud iría a la bandeja de un inspector.

test.describe('registro público de una empresa', () => {
  test('una farmacia se registra desde la pantalla pública y la Sede la ve pendiente de asignar', async ({ page }) => {
    const sufijo = sufijoUnico();
    const razonSocial = `E2E Registro ${sufijo}`;

    await page.goto('/ingresar');
    await page.getByRole('link', { name: 'Registrá tu empresa' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Registrar una empresa' })).toBeVisible();

    await elegirOpcion(page, page.getByRole('combobox', { name: 'Tipo de empresa' }), 'Farmacia');
    await page.getByLabel('Razón social').fill(razonSocial);
    await page.getByLabel('CUIT').fill(cuitUnico());
    await page.getByLabel('GLN').fill(glnUnico());
    await elegirOpcion(page, page.getByRole('combobox', { name: 'Provincia' }), 'Salta');
    await page.getByLabel('Localidad').fill('Salta');
    await page.getByLabel('Domicilio').fill('Calle de Prueba 123');
    await page.getByLabel('PDF de la habilitación').setInputFiles({
      name: 'habilitacion.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n'),
    });
    await page.getByLabel('Nombre', { exact: true }).fill('Prueba');
    await page.getByLabel('Apellido').fill('E2E');
    await page.getByLabel('DNI').fill(dniAlAzar());
    await page.getByLabel('Correo electrónico').fill(`e2e-${sufijo}@e2e.test`);
    await page.getByLabel('Contraseña').fill(contrasenaDeUnaVez());
    await page.getByRole('button', { name: 'Enviar la solicitud' }).click();

    await expect(page.getByRole('heading', { name: 'Solicitud enviada' })).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.listo')).toContainText('Pendiente de revisión');

    // La Sede la ve en su bandeja (provincia sin inspectores).
    // El registro es público (sin sesión): se ingresa recién ahora, como la Sede.
    await ingresar(page, cuentaSede());
    await expect(page.locator('.pendientes li', { hasText: razonSocial }), 'la solicitud nueva debería estar en la lista de la Sede').toBeVisible({ timeout: 20_000 });
  });
});
