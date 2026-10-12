import { DOCUMENT } from '@angular/common';
import { EnvironmentProviders, Injector, afterNextRender, inject, provideAppInitializer } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

/**
 * Al cambiar de pantalla, el foco pasa al título (`<h1>`) del contenido: quien usa lector de
 * pantalla escucha en qué pantalla está y quien navega con teclado empieza desde ahí. En una
 * aplicación de una sola página el navegador no hace esto solo. La primera navegación (la carga
 * inicial) no mueve el foco.
 */
export function proveerFocoEnNavegacion(): EnvironmentProviders {
  return provideAppInitializer(() => {
    const router = inject(Router);
    const documento = inject(DOCUMENT);
    const inyector = inject(Injector);
    let esLaPrimera = true;
    router.events.pipe(filter((evento) => evento instanceof NavigationEnd)).subscribe(() => {
      if (esLaPrimera) {
        esLaPrimera = false;
        return;
      }
      // Se espera a que la pantalla nueva esté dibujada: si no, el foco iría al título de la anterior.
      afterNextRender(
        () => {
          const destino = documento.querySelector<HTMLElement>('main h1') ?? documento.getElementById('contenido');
          if (destino !== null) {
            destino.setAttribute('tabindex', '-1');
            destino.focus();
          }
        },
        { injector: inyector },
      );
    });
  });
}
