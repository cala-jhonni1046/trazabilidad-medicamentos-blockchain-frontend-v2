import { expect, test } from '@playwright/test';

// e2e de LECTURA: escáner de cámara de la verificación pública (no necesita sesión).
// Usa la cámara FALSA de Chromium (un cuadro de prueba, sin códigos): comprueba que el escáner
// abre y cierra la cámara, que carga ZXing desde este mismo sitio (nunca desde un CDN) y que
// explica qué pasa cuando no hay permiso. Leer un DataMatrix real se prueba a mano con una caja.

// Cámara falsa de Chromium para todo el archivo (launchOptions solo puede ir arriba de todo).
test.use({
  permissions: ['camera'],
  launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] },
});

test.describe('escáner con cámara (cámara falsa)', () => {
  test('abre la cámara, carga ZXing desde el propio sitio y se cierra', async ({ page }) => {
    const externas: string[] = [];
    const wasm: number[] = [];
    page.on('request', (pedido) => {
      const url = new URL(pedido.url());
      if (url.origin !== new URL(page.url() === 'about:blank' ? 'http://localhost:4200' : page.url()).origin) {
        externas.push(pedido.url());
      }
    });
    page.on('response', (respuesta) => {
      if (respuesta.url().endsWith('/zxing/zxing_reader.wasm')) {
        wasm.push(respuesta.status());
      }
    });
    await page.goto('/verificar');

    await page.getByRole('button', { name: 'Escanear con la cámara' }).click();

    await expect(page.getByRole('group', { name: 'Escáner de cámara' })).toBeVisible();
    await expect(page.getByText('Apuntá la cámara al código de la caja')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('video')).toBeVisible();
    // El detector (nativo o ZXing) funciona sobre el cuadro de prueba sin romper ni llamar a un CDN.
    await page.waitForTimeout(1500);
    expect(wasm.every((estado) => estado === 200)).toBe(true);
    expect(externas.filter((u) => /jsdelivr|unpkg|cdnjs/.test(u))).toEqual([]);

    await page.getByRole('button', { name: 'Cerrar la cámara' }).click();
    await expect(page.locator('video')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Escanear con la cámara' })).toBeVisible();
  });

  test('el binario de ZXing se sirve desde /zxing', async ({ request }) => {
    const respuesta = await request.get('/zxing/zxing_reader.wasm');

    expect(respuesta.status()).toBe(200);
    expect(respuesta.headers()['content-type']).toContain('wasm');
  });
});

test.describe('escáner sin permiso de cámara', () => {
  test('explica que no hay permiso y deja escribir a mano (permiso denegado simulado)', async ({ page }) => {
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('denegado', 'NotAllowedError'));
    });
    await page.goto('/verificar');

    await page.getByRole('button', { name: 'Escanear con la cámara' }).click();

    await expect(page.getByRole('alert').filter({ hasText: 'a mano' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByLabel('GTIN', { exact: true })).toBeEnabled();
  });
});
