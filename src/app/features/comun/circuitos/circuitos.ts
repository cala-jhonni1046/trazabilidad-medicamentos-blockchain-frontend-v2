import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ListaCircuitos } from './lista-circuitos';

/** Pantalla "Circuitos": todos los circuitos que el usuario puede ver, con las acciones de su rol. */
@Component({
  selector: 'mc-circuitos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ListaCircuitos],
  template: `
    <h1>Circuitos</h1>
    <mc-lista-circuitos titulo="Circuitos" modo="todos" />
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
    }
  `,
})
export class Circuitos {}
