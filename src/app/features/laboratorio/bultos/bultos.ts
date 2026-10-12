import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { AvisosService } from '../../../core/errores/avisos.service';
import { ListaBultos } from '../../comun/bultos/lista-bultos';
import { FormularioArmarBulto } from './formulario-armar-bulto';

/** "Bultos" del laboratorio: armar bultos cerrados y ver los armados (se despachan en "Viajes"). */
@Component({
  selector: 'mc-bultos-laboratorio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormularioArmarBulto, ListaBultos],
  template: `
    <h1>Bultos</h1>
    <mc-formulario-armar-bulto (armado)="alArmar()" />
    <mc-lista-bultos titulo="Tus bultos" modo="laboratorio" />
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
    }
  `,
})
export class BultosLaboratorio {
  private readonly avisos = inject(AvisosService);
  private readonly lista = viewChild(ListaBultos);

  protected alArmar(): void {
    this.avisos.mostrarExito('Bulto armado.');
    this.lista()?.recargar();
  }
}
