import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core';
import { SesionService } from '../../../core/auth/sesion.service';
import { FormularioRecepcion } from './formulario-recepcion';
import { HistorialRecepciones } from './historial-recepciones';
import { ViajesEnCamino } from './viajes-en-camino';

/** "Recibir bultos" (distribuidora) / "Por recibir" (farmacia): viajes en camino, escaneo y actas. */
@Component({
  selector: 'mc-recepcion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormularioRecepcion, HistorialRecepciones, ViajesEnCamino],
  template: `
    <h1>{{ titulo() }}</h1>
    <mc-viajes-en-camino />
    <mc-formulario-recepcion (recibida)="alRecibir()" />
    <mc-historial-recepciones />
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
    }
  `,
})
export class Recepcion {
  private readonly sesion = inject(SesionService);
  private readonly historial = viewChild(HistorialRecepciones);
  private readonly enCamino = viewChild(ViajesEnCamino);

  protected readonly titulo = computed(() => (this.sesion.sesion()?.rol === 'FARMACIA' ? 'Por recibir' : 'Recibir bultos'));

  protected alRecibir(): void {
    this.historial()?.recargar();
    this.enCamino()?.recargar();
  }
}
