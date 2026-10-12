import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { AvisosService } from '../../../core/errores/avisos.service';
import { ListaLotes } from '../../comun/lotes/lista-lotes';
import { Icono } from '../../../shared/ui/icono';
import { DialogoNuevoLote } from './dialogo-nuevo-lote';

/** "Lotes" del laboratorio: sus lotes, la liberación por el director técnico y el alta de uno nuevo. */
@Component({
  selector: 'mc-lotes-laboratorio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icono, ListaLotes, MatButtonModule],
  template: `
    <header class="mc-barra">
      <h1>Lotes</h1>
      <button mat-flat-button type="button" (click)="registrar()"><mc-icono nombre="add" />Registrar un lote</button>
    </header>
    <mc-lista-lotes titulo="Tus lotes" modo="todos" />
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
    }
  `,
})
export class LotesLaboratorio {
  private readonly dialogo = inject(MatDialog);
  private readonly avisos = inject(AvisosService);
  private readonly lista = viewChild(ListaLotes);

  protected async registrar(): Promise<void> {
    const referencia = this.dialogo.open<DialogoNuevoLote, undefined, boolean>(DialogoNuevoLote, { width: 'min(720px, 95vw)' });
    if ((await firstValueFrom(referencia.afterClosed())) === true) {
      this.avisos.mostrarExito('Lote registrado. Queda pendiente de liberación.');
      this.lista()?.recargar();
    }
  }
}
