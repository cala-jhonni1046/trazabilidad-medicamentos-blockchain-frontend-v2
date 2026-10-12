import { EnvironmentProviders, inject, provideAppInitializer } from '@angular/core';
import { TemaService } from './tema.service';

/**
 * Aplica el tema guardado al arrancar la aplicación.
 *
 * Se hace en un inicializador (y no con un script en index.html) para no tener código
 * en línea que una política de seguridad de contenido (CSP) tendría que permitir.
 * Con la preferencia "sistema" no hay parpadeo: decide el CSS. Solo si alguien eligió
 * un modo distinto al de su sistema puede ver el otro fondo mientras carga la aplicación.
 */
export function proveerTema(): EnvironmentProviders {
  return provideAppInitializer(() => {
    inject(TemaService).iniciar();
  });
}
