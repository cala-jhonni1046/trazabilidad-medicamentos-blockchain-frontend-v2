import { ChangeDetectionStrategy, Component, computed, inject, viewChildren } from '@angular/core';
import { SesionService } from '../../../core/auth/sesion.service';
import { AvisosService } from '../../../core/errores/avisos.service';
import { FormularioProponerCircuito } from '../../laboratorio/formulario-proponer-circuito';
import { ListaCircuitos } from './lista-circuitos';

/**
 * Pantalla "Circuitos": todos los circuitos que el usuario puede ver, con las acciones de su rol.
 * El director técnico de un laboratorio además puede proponer uno; el administrador de una
 * distribuidora o farmacia ve primero los que esperan su aceptación.
 */
@Component({
  selector: 'mc-circuitos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormularioProponerCircuito, ListaCircuitos],
  template: `
    <h1>Circuitos</h1>
    @if (puedeProponer()) {
      <mc-formulario-proponer-circuito (propuesto)="alProponer()" />
    }
    @if (esEmpresaReceptora()) {
      <mc-lista-circuitos titulo="Esperan tu aceptación" modo="por-aceptar" />
    }
    <mc-lista-circuitos titulo="Circuitos" modo="todos" />
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
    }
  `,
})
export class Circuitos {
  private readonly sesion = inject(SesionService);
  private readonly avisos = inject(AvisosService);
  private readonly listas = viewChildren(ListaCircuitos);

  /** Solo el director técnico del laboratorio ve el formulario (la API igual decide). */
  protected readonly puedeProponer = computed(() => this.sesion.sesion()?.rol === 'LABORATORIO' && this.sesion.sesion()?.esDirectorTecnico === true);
  protected readonly esEmpresaReceptora = computed(() => ['DISTRIBUIDOR', 'FARMACIA'].includes(this.sesion.sesion()?.rol ?? ''));

  protected alProponer(): void {
    this.avisos.mostrarExito('Circuito propuesto. Esperan la aceptación de la distribuidora y la farmacia.');
    this.listas().forEach((lista) => lista.recargar());
  }
}
