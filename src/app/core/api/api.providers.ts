import { Provider } from '@angular/core';
import { provideApiConfiguration } from './generado/api-configuration';

/**
 * Raíz de las URLs del cliente generado: vacía, así cada operación queda relativa
 * (`/api/...`) y va al mismo origen que el frontend (en desarrollo, al proxy).
 *
 * No se usa el `servers` del contrato ("/"): el generador arma la URL como
 * `rootUrl + ruta`, y "/" + "/api/bultos" daría "//api/bultos", que el navegador
 * toma como una dirección de otro host ("api").
 */
export const RAIZ_API = '';

/** Configura el cliente generado (ng-openapi-gen) con {@link RAIZ_API} como raíz. */
export function proveerClienteApi(): Provider {
  return provideApiConfiguration(RAIZ_API);
}
