import { EnvironmentProviders, inject, provideAppInitializer } from '@angular/core';
import { SesionService } from './sesion.service';

/**
 * Recupera la sesión guardada al arrancar la aplicación, antes de la primera navegación:
 * así los guards ya saben si hay alguien adentro al recargar la página.
 */
export function proveerSesion(): EnvironmentProviders {
  return provideAppInitializer(() => {
    inject(SesionService).restaurar();
  });
}
