import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ListaReportes } from '../../comun/reportes/lista-reportes';

/** "Mis reportes" del paciente: solo los suyos, con su estado y fechas (la conclusión no se le muestra). */
@Component({
  selector: 'mc-mis-reportes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ListaReportes],
  template: `
    <h1>Mis reportes</h1>
    <mc-lista-reportes titulo="Tus reportes" modo="todos" />
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
    }
  `,
})
export class MisReportes {}
