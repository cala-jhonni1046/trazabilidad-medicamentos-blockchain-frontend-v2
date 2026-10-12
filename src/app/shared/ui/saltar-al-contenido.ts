import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

/** Identificador del `<main>` al que salta el enlace (cada marco lo pone en su contenido). */
export const ID_CONTENIDO = 'contenido';

/**
 * Enlace "Saltar al contenido" para quien navega con teclado o lector de pantalla: es lo primero
 * que recibe el foco y lleva directo al contenido, sin recorrer todo el menú. Es invisible hasta
 * que recibe el foco. No usa `href="#…"` porque con `<base href="/">` navegaría a la raíz.
 */
@Component({
  selector: 'mc-saltar-al-contenido',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<a href="#" (click)="saltar($event)">Saltar al contenido</a>`,
  styles: `
    a {
      position: absolute;
      top: -100px;
      left: 8px;
      z-index: 1000;
      padding: 8px 14px;
      background: var(--mc-primario);
      color: var(--mc-sobre-primario);
      border-radius: var(--mc-radio-control);
      font-weight: 700;
      text-decoration: none;
    }
    a:focus {
      top: 8px;
    }
  `,
})
export class SaltarAlContenido {
  private readonly documento = inject(DOCUMENT);

  protected saltar(evento: Event): void {
    evento.preventDefault();
    this.documento.getElementById(ID_CONTENIDO)?.focus();
  }
}
