import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { proveerClienteApi } from './core/api/api.providers';

/** Configuración raíz de la aplicación (proveedores globales). */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // HttpClient; acá se registran los interceptores funcionales (auth y errores).
    provideHttpClient(withInterceptors([])),
    // Cliente generado desde api/openapi.json, con URLs relativas /api/...
    proveerClienteApi(),
  ],
};
