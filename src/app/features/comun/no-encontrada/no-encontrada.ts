import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Página para una ruta que no existe. */
@Component({
  selector: 'mc-no-encontrada',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <main class="no-encontrada">
      <h1>No encontramos esta página</h1>
      <p>La dirección no existe o cambió.</p>
      <p><a routerLink="/">Ir al inicio</a></p>
    </main>
  `,
  styles: `
    .no-encontrada {
      display: grid;
      gap: 8px;
      max-width: 640px;
      margin: 0 auto;
      padding: 32px 16px;
    }
  `,
})
export class NoEncontrada {}
