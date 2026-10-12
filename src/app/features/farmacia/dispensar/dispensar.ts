import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { AvisosService } from '../../../core/errores/avisos.service';
import { FormularioDispensar } from './formulario-dispensar';
import { HistorialDispensaciones } from './historial-dispensaciones';

/** "Dispensar": escanear y dispensar una caja, y el historial de la farmacia con la anulación. */
@Component({
  selector: 'mc-dispensar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormularioDispensar, HistorialDispensaciones],
  template: `
    <h1>Dispensar</h1>
    <mc-formulario-dispensar (dispensada)="alDispensar()" />
    <mc-historial-dispensaciones />
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
    }
  `,
})
export class Dispensar {
  private readonly avisos = inject(AvisosService);
  private readonly historial = viewChild(HistorialDispensaciones);

  protected alDispensar(): void {
    this.avisos.mostrarExito('Caja dispensada.');
    this.historial()?.recargar();
  }
}
