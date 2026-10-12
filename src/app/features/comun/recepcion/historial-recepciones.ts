import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { RecepcionesService } from '../../../core/api/generado/services/recepciones.service';
import { RecepcionResponseDto } from '../../../core/api/modelos';
import { ListaPaginada } from '../../../core/listas/lista-paginada';
import { proveerPaginadorEs } from '../../../core/tema/paginador-es';
import { PRESENTACION_RECEPCION } from '../../../shared/estados/catalogo-estados';
import { Estado } from '../../../shared/estados/estado';
import { FechaHoraPipe } from '../../../shared/formato/pipes-fechas';
import { ErrorApiComponente } from '../../../shared/ui/error-api';
import { Tarjeta } from '../../../shared/ui/tarjeta';

/** Actas de recepción de la empresa: cuándo, qué bulto, con qué temperatura y si fue conforme (lo decidió el servidor). */
@Component({
  selector: 'mc-historial-recepciones',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ErrorApiComponente, Estado, FechaHoraPipe, MatButtonModule, MatPaginatorModule, Tarjeta],
  providers: [...proveerPaginadorEs()],
  template: `
    <mc-tarjeta titulo="Recepciones registradas" [detalle]="lista.total() + ' en total'">
      @if (lista.error(); as error) {
        <mc-error-api [error]="error" />
        <div><button mat-stroked-button type="button" (click)="lista.recargar()">Reintentar</button></div>
      } @else if (lista.vacia()) {
        <p class="mc-vacio">Todavía no registraste recepciones.</p>
      } @else {
        <div class="mc-tabla" tabindex="0" role="region" aria-label="Recepciones registradas">
          <table>
            <thead><tr><th>Fecha</th><th>Bulto</th><th>Temperatura</th><th>Precinto</th><th>Cajas</th><th>Resultado</th></tr></thead>
            <tbody>
              @for (r of lista.elementos(); track r.id) {
                <tr>
                  <td>{{ r.fechaHora | fechaHora }}</td>
                  <td><code>{{ r.codigoBulto }}</code></td>
                  <td>{{ r.temperatura }} °C</td>
                  <td>{{ r.precintoIntacto ? 'Intacto' : 'Roto' }}</td>
                  <td>{{ r.cantidadVerificada }}</td>
                  <td>
                    <mc-estado [presentacion]="r.conforme ? presentacion.conforme : presentacion.rechazada" />
                    @if (r.motivoRechazo) {
                      <span class="secundario">{{ r.motivoRechazo }}</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <mat-paginator [length]="lista.total()" [pageSize]="lista.tamano()" [pageIndex]="lista.paginaActual()" [pageSizeOptions]="[10, 20, 50]" (page)="cambiarPagina($event)" aria-label="Página de recepciones" />
      }
    </mc-tarjeta>
  `,
})
export class HistorialRecepciones {
  private readonly api = inject(RecepcionesService);
  protected readonly presentacion = PRESENTACION_RECEPCION;

  protected readonly lista = new ListaPaginada<RecepcionResponseDto>(null, ({ pagina, tamano }) =>
    this.api.listarRecepciones({ page: pagina, size: tamano }),
  );

  recargar(): void {
    this.lista.recargar();
  }

  protected cambiarPagina(evento: PageEvent): void {
    this.lista.irA(evento.pageIndex, evento.pageSize);
  }
}
