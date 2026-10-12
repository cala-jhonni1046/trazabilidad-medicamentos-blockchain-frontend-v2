import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ListaEmpresas } from './lista-empresas';

/** Pantalla "Empresas" (Sede e inspectores): todas las empresas que el usuario puede ver. */
@Component({
  selector: 'mc-empresas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ListaEmpresas],
  template: `
    <h1>Empresas</h1>
    <mc-lista-empresas titulo="Empresas registradas" modo="todas" />
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
    }
  `,
})
export class Empresas {}
