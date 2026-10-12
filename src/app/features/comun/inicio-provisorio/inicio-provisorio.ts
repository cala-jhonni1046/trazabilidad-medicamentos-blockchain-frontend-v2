import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SesionService } from '../../../core/auth/sesion.service';

/**
 * Inicio PROVISORIO de cada rol, hasta que lleguen sus pantallas: dice quién ingresó.
 * El menú y "Salir" están en el marco (ShellApp).
 */
@Component({
  selector: 'mc-inicio-provisorio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (sesion.sesion(); as actual) {
      <h1>Hola, {{ actual.nombre }}</h1>
      <p>Las pantallas de este rol están en construcción.</p>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 8px;
    }
  `,
})
export class InicioProvisorio {
  protected readonly sesion = inject(SesionService);
}
