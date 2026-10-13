import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ListaCajas } from './lista-cajas';

/**
 * "Stock" de la farmacia, en dos tarjetas: las cajas que ya tiene (EN_STOCK, con "Devolver") y las que
 * vienen hacia ella (EN_TRANSITO, todavía no recibidas). Cada una pide su estado a la API con `?estado=` y
 * tiene su propio paginador: la pantalla no decide cuál es cuál.
 */
@Component({
  selector: 'mc-stock',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ListaCajas],
  template: `
    <h1>Stock</h1>
    <mc-lista-cajas titulo="En stock" estado="EN_STOCK" textoVacio="No tenés cajas en stock todavía." [devolvible]="true" />
    <mc-lista-cajas titulo="En camino" estado="EN_TRANSITO" textoVacio="No hay cajas en camino hacia tu farmacia." />
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
    }
  `,
})
export class Stock {}
