import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Verificar } from '../../publico/verificar/verificar';
import { CodigoLeido } from '../../../shared/ui/campo-codigo';
import { FormularioReporte } from './formulario-reporte';

/**
 * "Verificar un medicamento" del paciente: la misma verificación pública y, debajo, el reporte
 * de la caja consultada. No hay "Mis medicamentos": lo que dispensó cada farmacia no se
 * muestra al paciente (R13).
 */
@Component({
  selector: 'mc-verificar-y-reportar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormularioReporte, Verificar],
  template: `
    <mc-verificar (consultada)="ultima.set($event)" />
    <mc-formulario-reporte [codigo]="ultima()" />
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
      max-width: 720px;
    }
  `,
})
export class VerificarYReportar {
  protected readonly ultima = signal<CodigoLeido | null>(null);
}
