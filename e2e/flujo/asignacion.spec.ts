import { APIRequestContext, expect, test } from '@playwright/test';
import { cuentaSede } from '../soporte/cuentas';
import { ingresar } from '../soporte/ingreso';
import { contrasenaDeUnaVez, cuitUnico, dniAlAzar, glnUnico, sufijoUnico } from '../soporte/identificadores';

// e2e de FLUJO: MODIFICA DATOS. Lo corre SOLO el autor, a mano (ver CLAUDE.md).
//
// Cada corrida deja UNA empresa pendiente más (con su cuenta de administrador) y la asigna a
// un inspector, así que cada corrida suma una solicitud ya asignada a la base. No necesita
// reset-demo.sh, pero sí que la provincia SALTA no tenga inspectores activos (como en los
// datos de la demo): si no, la solicitud iría a la bandeja de un inspector y no a la de la Sede.

const PROVINCIA_SIN_INSPECTORES = 'SALTA';

/** Registra una farmacia nueva por la API pública (sin sesión) y devuelve su razón social. */
async function registrarFarmaciaPendiente(request: APIRequestContext): Promise<string> {
  const sufijo = sufijoUnico();
  const razonSocial = `E2E Farmacia ${sufijo}`;
  const respuesta = await request.post('/api/registro/empresas', {
    multipart: {
      tipo: 'FARMACIA',
      cuit: cuitUnico(),
      razonSocial,
      gln: glnUnico(),
      provincia: PROVINCIA_SIN_INSPECTORES,
      localidad: 'Salta',
      domicilio: 'Calle de Prueba 123',
      adminEmail: `e2e-${sufijo}@e2e.test`,
      adminPassword: contrasenaDeUnaVez(),
      adminNombre: 'Prueba',
      adminApellido: 'E2E',
      adminDni: dniAlAzar(),
      documento: {
        name: 'habilitacion.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n'),
      },
    },
  });
  expect(respuesta.status(), 'el registro público de la farmacia de prueba').toBe(201);
  return razonSocial;
}

test.describe('asignación de una solicitud (tablero de la Sede)', () => {
  test('una solicitud de una provincia sin inspector se asigna desde el tablero y sale de la lista', async ({
    page,
    request,
  }) => {
    const razonSocial = await registrarFarmaciaPendiente(request);

    await ingresar(page, cuentaSede());
    const solicitud = page.locator('.pendientes li', { hasText: razonSocial });
    await expect(
      solicitud,
      'la solicitud nueva debería estar en la lista (si hay más de 20 pendientes, está más abajo: corré reset-demo.sh; si SALTA tiene inspectores, no llega a la Sede)',
    ).toBeVisible();

    await solicitud.getByRole('button', { name: /Asignar/ }).click();
    const dialogo = page.getByRole('dialog');
    await expect(dialogo).toContainText(razonSocial);
    await dialogo.getByRole('combobox', { name: 'Inspector' }).click();
    await page.getByRole('option').first().click();
    await dialogo.getByRole('button', { name: 'Asignar', exact: true }).click();

    await expect(dialogo).toBeHidden();
    await expect(page.getByText(/^Asignado a /)).toBeVisible();
    await expect(page.locator('.pendientes li', { hasText: razonSocial })).toHaveCount(0);
  });

  test('si no se elige inspector, el diálogo lo pide y no asigna', async ({ page, request }) => {
    const razonSocial = await registrarFarmaciaPendiente(request);

    await ingresar(page, cuentaSede());
    const solicitud = page.locator('.pendientes li', { hasText: razonSocial });
    await solicitud.getByRole('button', { name: /Asignar/ }).click();
    const dialogo = page.getByRole('dialog');
    await dialogo.getByRole('button', { name: 'Asignar', exact: true }).click();

    await expect(dialogo.getByText('Elegí un inspector.')).toBeVisible();
    await dialogo.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialogo).toBeHidden();
    // Sigue pendiente: este test también deja una solicitud sin asignar en la base.
    await expect(solicitud).toBeVisible();
  });
});
