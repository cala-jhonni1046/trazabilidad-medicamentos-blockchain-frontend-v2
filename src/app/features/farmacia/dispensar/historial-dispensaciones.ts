import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { DispensacionesService } from '../../../core/api/generado/services/dispensaciones.service';
import { DispensacionResponseDto } from '../../../core/api/modelos';
import { aResultado } from '../../../core/api/resultado';
import { ListaPaginada } from '../../../core/listas/lista-paginada';
import { proveerPaginadorEs } from '../../../core/tema/paginador-es';
import { PRESENTACION_DISPENSACION } from '../../../shared/estados/catalogo-estados';
import { Estado } from '../../../shared/estados/estado';
import { FechaHoraPipe } from '../../../shared/formato/pipes-fechas';
import { ErrorApiComponente } from '../../../shared/ui/error-api';
import { EjecutorAcciones } from '../../../shared/ui/ejecutor-acciones';
import { Tarjeta } from '../../../shared/ui/tarjeta';

/**
 * Dispensaciones de la farmacia, con "Anular". El botón se ofrece en toda dispensación no
 * anulada: el plazo de 2 horas (R11) lo decide la API, que responde 409 si pasó.
 * Del paciente solo se muestra el DNI enmascarado que devuelve la API (R13).
 */
@Component({
  selector: 'mc-historial-dispensaciones',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ErrorApiComponente, Estado, FechaHoraPipe, MatButtonModule, MatPaginatorModule, Tarjeta],
  providers: [...proveerPaginadorEs()],
  template: `
    <mc-tarjeta titulo="Dispensaciones de tu farmacia" detalle="Se pueden anular dentro de las 2 horas">
      @if (lista.error(); as error) {
        <mc-error-api [error]="error" />
        <div><button mat-stroked-button type="button" (click)="lista.recargar()">Reintentar</button></div>
      } @else if (lista.vacia()) {
        <p class="mc-vacio">Todavía no dispensaste cajas.</p>
      } @else {
        <div class="mc-tabla" tabindex="0" role="region" aria-label="Dispensaciones">
          <table>
            <thead><tr><th>Fecha</th><th>Caja</th><th>Cobertura</th><th>Receta</th><th>DNI</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              @for (d of lista.elementos(); track d.id) {
                <tr>
                  <td>{{ d.fechaHora | fechaHora }}</td>
                  <td><code>{{ d.serie }}</code><span class="secundario">GTIN {{ d.gtin }}</span></td>
                  <td>
                    @if (d.particular) {
                      Particular
                    } @else {
                      {{ d.obraSocial }}<span class="secundario">Afiliado {{ d.numeroAfiliado }}</span>
                    }
                  </td>
                  <td>{{ d.numeroReceta }}</td>
                  <td>{{ d.dniEnmascarado ?? '—' }}</td>
                  <td><mc-estado [presentacion]="d.anulada ? presentacion.anulada : presentacion.vigente" /></td>
                  <td>
                    <div class="mc-acciones">
                      @if (!d.anulada) {
                        <button mat-stroked-button type="button" [disabled]="ocupada()" (click)="anular(d)">Anular<span class="mc-solo-lectores"> la dispensación de {{ d.serie }}</span></button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <mat-paginator [length]="lista.total()" [pageSize]="lista.tamano()" [pageIndex]="lista.paginaActual()" [pageSizeOptions]="[10, 20, 50]" (page)="cambiarPagina($event)" aria-label="Página de dispensaciones" />
      }
    </mc-tarjeta>
  `,
})
export class HistorialDispensaciones {
  private readonly api = inject(DispensacionesService);
  private readonly ejecutor = inject(EjecutorAcciones);

  protected readonly presentacion = PRESENTACION_DISPENSACION;
  protected readonly lista = new ListaPaginada<DispensacionResponseDto>(null, ({ pagina, tamano }) =>
    this.api.listarDispensaciones({ page: pagina, size: tamano }),
  );
  protected readonly ocupada = signal(false);

  recargar(): void {
    this.lista.recargar();
  }

  protected cambiarPagina(evento: PageEvent): void {
    this.lista.irA(evento.pageIndex, evento.pageSize);
  }

  protected async anular(d: DispensacionResponseDto): Promise<void> {
    this.ocupada.set(true);
    const hecho = await this.ejecutor.conDialogo(
      {
        titulo: 'Anular la dispensación',
        detalle: `Caja ${d.serie}`,
        aviso: 'La caja vuelve a estar en stock. Solo se puede anular dentro de las 2 horas.',
        campo: { etiqueta: 'Motivo de la anulación' },
        boton: 'Anular',
        accion: (motivo) => aResultado(this.api.anularDispensacion({ id: d.id, body: { motivo } })),
      },
      `Dispensación de ${d.serie} anulada.`,
    );
    if (hecho) {
      this.lista.recargar();
    }
    this.ocupada.set(false);
  }
}
