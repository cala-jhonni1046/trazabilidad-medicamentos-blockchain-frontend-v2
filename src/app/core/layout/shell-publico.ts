import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SesionService } from '../auth/sesion.service';
import { SaltarAlContenido } from '../../shared/ui/saltar-al-contenido';
import { SelectorTema } from '../tema/selector-tema';

/** Marco de las pantallas públicas (ingreso, verificación): marca arriba y tema a la derecha. */
@Component({
  selector: 'mc-shell-publico',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, SaltarAlContenido, SelectorTema],
  template: `
    <mc-saltar-al-contenido />
    <header class="barra">
      <a class="marca" routerLink="/" aria-label="MediChain, ir al inicio">Medi<span>Chain</span></a>
      <nav class="enlaces" aria-label="Principal">
        <a routerLink="/verificar" routerLinkActive="activo" ariaCurrentWhenActive="page">Verificar un medicamento</a>
        @if (sesion.autenticado()) {
          <a routerLink="/">Volver a mi cuenta</a>
        } @else {
          <a routerLink="/ingresar" routerLinkActive="activo" ariaCurrentWhenActive="page">Ingresar</a>
        }
      </nav>
      <mc-selector-tema />
    </header>
    <main id="contenido" class="contenido" tabindex="-1">
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
    .enlaces {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 16px;
      margin-right: auto;
      margin-left: 16px;
    }
    .enlaces a {
      padding: 4px 2px;
      color: var(--mc-texto);
      font-weight: 600;
      text-decoration: none;
    }
    .enlaces a:hover,
    .enlaces a.activo {
      color: var(--mc-primario);
      text-decoration: underline;
    }
    .contenido:focus,
    h1:focus {
      outline: none;
    }
    .contenido {
      max-width: 1040px;
      margin: 0 auto;
      padding: 8px 16px 48px;
    }
  `,
})
export class ShellPublico {
  protected readonly sesion = inject(SesionService);
}
