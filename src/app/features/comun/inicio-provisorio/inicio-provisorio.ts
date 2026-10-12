import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { SesionService } from '../../../core/auth/sesion.service';

/**
 * Inicio PROVISORIO de cada rol, hasta que lleguen sus pantallas: muestra quién
 * ingresó y permite salir. Lo usan las rutas de los seis roles.
 */
@Component({
  selector: 'mc-inicio-provisorio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule],
  template: `
    <main class="provisoria">
      @if (sesion.sesion(); as actual) {
        <h1>Hola, {{ actual.nombre }}</h1>
        <p>Ingresaste con el rol <code>{{ actual.rol }}</code>. Las pantallas de este rol están en construcción.</p>
      }
      <p>
        <button mat-stroked-button type="button" (click)="salir()">Salir</button>
      </p>
    </main>
  `,
  styles: `
    .provisoria {
      display: grid;
      gap: 12px;
      max-width: 640px;
      margin: 0 auto;
      padding: 32px 16px;
    }
  `,
})
export class InicioProvisorio {
  protected readonly sesion = inject(SesionService);

  /** Cierra la sesión y vuelve a la pantalla de ingreso. */
  protected salir(): void {
    this.sesion.finalizarSesion('salida');
  }
}
