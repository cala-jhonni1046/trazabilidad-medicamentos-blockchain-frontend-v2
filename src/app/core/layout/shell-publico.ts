import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { SelectorTema } from '../tema/selector-tema';

/** Marco de las pantallas públicas (ingreso, verificación): marca arriba y tema a la derecha. */
@Component({
  selector: 'mc-shell-publico',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterOutlet, SelectorTema],
  template: `
    <header class="barra">
      <a class="marca" routerLink="/" aria-label="MediChain, ir al inicio">Medi<span>Chain</span></a>
      <mc-selector-tema />
    </header>
    <main class="contenido">
      <router-outlet />
    </main>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
    }
    .barra {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      justify-content: space-between;
      max-width: 1040px;
      margin: 0 auto;
      padding: 16px;
    }
    .marca {
      font-family: var(--mc-fuente-titulos);
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--mc-texto);
      text-decoration: none;
    }
    .marca span {
      color: var(--mc-primario);
    }
    .contenido {
      max-width: 1040px;
      margin: 0 auto;
      padding: 8px 16px 48px;
    }
  `,
})
export class ShellPublico {}
