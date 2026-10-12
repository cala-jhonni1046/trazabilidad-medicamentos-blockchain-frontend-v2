import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ListaBultos } from '../../comun/bultos/lista-bultos';

/** "Depósito" de la distribuidora: los bultos recibidos del laboratorio, a la espera de su viaje a la farmacia. */
@Component({
  selector: 'mc-deposito',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ListaBultos],
  template: `
    <h1>Depósito</h1>
    <mc-lista-bultos titulo="Bultos en tu depósito" modo="deposito" />
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
    }
  `,
})
export class Deposito {}
