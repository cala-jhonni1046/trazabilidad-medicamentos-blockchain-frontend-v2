import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Pantalla de ingreso. PROVISORIA: solo ocupa la ruta /ingresar, a la que llevan los
 * guards y el cierre de sesión. El formulario real llega en el paso siguiente.
 */
@Component({
  selector: 'mc-ingresar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="provisoria">
      <h1>Ingresar</h1>
      <p>La pantalla de ingreso está en construcción.</p>
    </main>
  `,
  styles: `
    .provisoria {
      display: grid;
      gap: 8px;
      max-width: 640px;
      margin: 0 auto;
      padding: 32px 16px;
    }
  `,
})
export class Ingresar {}
