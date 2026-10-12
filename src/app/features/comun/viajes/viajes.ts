import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core';
import { SesionService } from '../../../core/auth/sesion.service';
import { AvisosService } from '../../../core/errores/avisos.service';
import { FormularioNuevoViaje } from './formulario-nuevo-viaje';
import { ListaViajes } from './lista-viajes';

/**
 * "Viajes" del laboratorio (tramo 1, hacia la distribuidora) y de la distribuidora (tramo 2,
 * hacia las farmacias): armar un viaje, registrar su salida y ver sus temperaturas.
 * La telemetría la carga el sensor (script del backend): acá solo se muestra.
 */
@Component({
  selector: 'mc-viajes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormularioNuevoViaje, ListaViajes],
  template: `
    <h1>{{ esLaboratorio() ? 'Viajes · tramo 1' : 'Viajes · tramo 2' }}</h1>
    <mc-formulario-nuevo-viaje [estadoBultos]="esLaboratorio() ? 'ARMADO' : 'EN_DEPOSITO'" (creado)="alCrear()" />
    <mc-lista-viajes />
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
    }
  `,
})
export class Viajes {
  private readonly avisos = inject(AvisosService);
  private readonly lista = viewChild(ListaViajes);
  private readonly sesion = inject(SesionService);
  protected readonly esLaboratorio = computed(() => this.sesion.sesion()?.rol === 'LABORATORIO');

  protected alCrear(): void {
    this.avisos.mostrarExito('Viaje creado. Registrá su salida cuando el camión parta.');
    this.lista()?.recargar();
  }
}
