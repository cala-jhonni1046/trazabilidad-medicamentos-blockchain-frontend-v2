import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ListaLotes } from '../../comun/lotes/lista-lotes';
import { ListaMedidas } from '../../comun/medidas/lista-medidas';

/** "Lotes y cuarentenas" del inspector: todos los lotes y todas las medidas sanitarias que ve. */
@Component({
  selector: 'mc-lotes-y-medidas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ListaLotes, ListaMedidas],
  template: `
    <h1>Lotes y cuarentenas</h1>
    <mc-lista-lotes titulo="Lotes" modo="todos" />
    <mc-lista-medidas titulo="Cuarentenas y recalls" modo="todas" />
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
    }
  `,
})
export class LotesYMedidas {}
