import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { firstValueFrom } from 'rxjs';
import { MedicamentosService } from '../../../core/api/generado/services/medicamentos.service';
import { MedicamentoResponseDto } from '../../../core/api/modelos';
import { AvisosService } from '../../../core/errores/avisos.service';
import { ListaPaginada } from '../../../core/listas/lista-paginada';
import { proveerPaginadorEs } from '../../../core/tema/paginador-es';
import { ErrorApiComponente } from '../../../shared/ui/error-api';
import { Icono } from '../../../shared/ui/icono';
import { Tarjeta } from '../../../shared/ui/tarjeta';
import { DialogoNuevoMedicamento } from './dialogo-nuevo-medicamento';

/** "Medicamentos" del laboratorio: su catálogo y el alta de uno nuevo. */
@Component({
  selector: 'mc-medicamentos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ErrorApiComponente, Icono, MatButtonModule, MatPaginatorModule, Tarjeta],
  providers: [...proveerPaginadorEs()],
  template: `
    <header class="mc-barra">
      <h1>Medicamentos</h1>
      <button mat-flat-button type="button" (click)="registrar()"><mc-icono nombre="add" />Registrar un medicamento</button>
    </header>
    <mc-tarjeta titulo="Catálogo" [detalle]="lista.total() + ' en total'">
      @if (lista.error(); as error) {
        <mc-error-api [error]="error" />
        <div><button mat-stroked-button type="button" (click)="lista.recargar()">Reintentar</button></div>
      } @else if (lista.vacia()) {
        <p class="mc-vacio">Todavía no registraste medicamentos. Los necesitás para registrar lotes.</p>
      } @else {
        <div class="mc-tabla" tabindex="0" role="region" aria-label="Medicamentos">
          <table>
            <thead><tr><th>Medicamento</th><th>GTIN</th><th>Presentación</th><th>Conservación</th></tr></thead>
            <tbody>
              @for (m of lista.elementos(); track m.id) {
                <tr>
                  <td>
                    <strong>{{ m.nombreComercial }}</strong>
                    <span class="secundario">{{ m.principioActivo }} · {{ m.concentracion }}@if (m.biologico) { · biológico }</span>
                  </td>
                  <td><code>{{ m.gtin }}</code></td>
                  <td>{{ m.formaFarmaceutica }} · {{ m.presentacion }}</td>
                  <td>
                    @if (m.temperaturaMinima !== null && m.temperaturaMinima !== undefined && m.temperaturaMaxima !== null && m.temperaturaMaxima !== undefined) {
                      {{ m.temperaturaMinima }} a {{ m.temperaturaMaxima }} °C
                    } @else {
                      —
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <mat-paginator [length]="lista.total()" [pageSize]="lista.tamano()" [pageIndex]="lista.paginaActual()" [pageSizeOptions]="[10, 20, 50]" (page)="cambiarPagina($event)" aria-label="Página de medicamentos" />
      }
    </mc-tarjeta>
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
    }
  `,
})
export class Medicamentos {
  private readonly api = inject(MedicamentosService);
  private readonly dialogo = inject(MatDialog);
  private readonly avisos = inject(AvisosService);

  protected readonly lista = new ListaPaginada<MedicamentoResponseDto>(null, ({ pagina, tamano }) =>
    this.api.listarMedicamentos({ page: pagina, size: tamano }),
  );

  protected cambiarPagina(evento: PageEvent): void {
    this.lista.irA(evento.pageIndex, evento.pageSize);
  }

  protected async registrar(): Promise<void> {
    const referencia = this.dialogo.open<DialogoNuevoMedicamento, undefined, boolean>(DialogoNuevoMedicamento, { width: 'min(680px, 95vw)' });
    if ((await firstValueFrom(referencia.afterClosed())) === true) {
      this.avisos.mostrarExito('Medicamento registrado.');
      this.lista.recargar();
    }
  }
}
