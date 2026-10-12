import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { proveerClienteApi } from './core/api/api.providers';
import { authInterceptor } from './core/auth/auth.interceptor';
import { proveerSesion } from './core/auth/sesion.providers';
import { erroresInterceptor } from './core/errores/errores.interceptor';
import { proveerFocoEnNavegacion } from './core/layout/foco-navegacion';
import { proveerTema } from './core/tema/tema.providers';

/** Configuración raíz de la aplicación (proveedores globales). */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // HttpClient con los interceptores funcionales, en este orden:
    // 1. auth: agrega el token a /api/... (o corta si la sesión venció);
    // 2. errores: convierte cada error en ErrorApi y resuelve lo global.
    provideHttpClient(withInterceptors([authInterceptor, erroresInterceptor])),
    // Cliente generado desde api/openapi.json, con URLs relativas /api/...
    proveerClienteApi(),
    // Sesión guardada (si hay), recuperada antes de la primera navegación.
    proveerSesion(),
    // Al cambiar de pantalla, el foco pasa al título (accesibilidad).
    proveerFocoEnNavegacion(),
    // Tema claro / oscuro / sistema guardado, aplicado al arrancar.
    proveerTema(),
  ],
};
