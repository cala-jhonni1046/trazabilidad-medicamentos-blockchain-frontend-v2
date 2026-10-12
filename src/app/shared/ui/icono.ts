import { ChangeDetectionStrategy, Component, Injectable, inject, input } from '@angular/core';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { ICONOS, NombreIcono } from './iconos';

/** Prefijo con el que se registran los íconos propios en Material (por ejemplo "mc:home"). */
const ESPACIO = 'mc';

/**
 * Registra todos los íconos de {@link ICONOS} en el registro de Material, una sola vez.
 * El contenido es estático y viene de un paquete propio (nunca de la API), por eso se
 * marca como confiable.
 */
@Injectable({ providedIn: 'root' })
export class RegistroIconos {
  constructor() {
    const registro = inject(MatIconRegistry);
    const sanitizador = inject(DomSanitizer);
    for (const [nombre, svg] of Object.entries(ICONOS)) {
      registro.addSvgIconLiteralInNamespace(ESPACIO, nombre, sanitizador.bypassSecurityTrustHtml(svg));
    }
  }
}

/**
 * Ícono decorativo (aria-hidden): el significado siempre va en un texto al lado.
 * Uso: `<mc-icono nombre="home" />`. Toma el color del texto que lo rodea.
 */
@Component({
  selector: 'mc-icono',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `<mat-icon [svgIcon]="'mc:' + nombre()" aria-hidden="true" />`,
  styles: `
    :host {
      display: inline-flex;
      vertical-align: middle;
    }
  `,
})
export class Icono {
  /** Ícono a mostrar. */
  readonly nombre = input.required<NombreIcono>();

  constructor() {
    inject(RegistroIconos);
  }
}
