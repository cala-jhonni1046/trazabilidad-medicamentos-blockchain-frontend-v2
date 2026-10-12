import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

// Variables locales de los e2e (contraseñas): se leen de .env.e2e si existe. Ese archivo
// está fuera de Git. Lo que ya esté exportado en el entorno gana: loadEnvFile no pisa
// variables existentes.
const ARCHIVO_VARIABLES = '.env.e2e';
if (existsSync(ARCHIVO_VARIABLES)) {
  process.loadEnvFile(ARCHIVO_VARIABLES);
}

/**
 * Configuración de los e2e (Playwright) contra el backend REAL.
 *
 * NO levanta nada: necesita el backend en :8080 y `npm start` (frontend en :4200) ya
 * corriendo. Los corre solo el autor, a mano (ver CLAUDE.md, sección "e2e").
 * Las credenciales llegan solo por variables de entorno, exportadas o en .env.e2e (ver e2e/soporte/cuentas.ts).
 */
export default defineConfig({
  testDir: 'e2e',
  // Una sola persona a la vez: los tests comparten la base del backend.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:4200',
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Buenos_Aires',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
