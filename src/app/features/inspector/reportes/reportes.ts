import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ListaReportes } from '../../comun/reportes/lista-reportes';

/** "Reportes" del inspector: todos los reportes ciudadanos que ve, con filtro por estado. */
@Component({
  selector: 'mc-reportes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ListaReportes],
  template: `
    <h1>Reportes ciudadanos</h1>
    <mc-lista-reportes titulo="Reportes" modo="todos" />
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
    }
  `,
})
export class Reportes {}
