import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { map } from 'rxjs';
import { ViajesService } from '../../../core/api/generado/services/viajes.service';
import { DespachoLogisticoResponseDto } from '../../../core/api/modelos';
import { TAMANO_PAGINA_MAXIMO } from '../../../core/api/pagina';
import { SesionService } from '../../../core/auth/sesion.service';
import { ErrorApi, parsearErrorApi } from '../../../core/errores/error-api';
import { ROTULO_TRAMO } from '../../../shared/formato/etiquetas';
import { FechaHoraPipe } from '../../../shared/formato/pipes-fechas';
import { Tarjeta } from '../../../shared/ui/tarjeta';
import { HttpErrorResponse } from '@angular/common/http';

/**
 * "En camino hacia vos": los viajes EN_TRANSITO (se piden con `?estado=`) que no origina la propia empresa.
 * Cada viaje trae el nombre de su origen. La API no dice qué bultos de un viaje con varias paradas son de
 * esta empresa: se muestran los códigos del viaje tal como vienen (ver "fuga de alcance de las paradas" en
 * docs/pedidos-b12.md).
 */
@Component({
  selector: 'mc-viajes-en-camino',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FechaHoraPipe, MatButtonModule, Tarjeta],
  template: `
    <mc-tarjeta titulo="En camino hacia vos" [detalle]="entrantes().length + ' viajes en tránsito'">
      @let r = recurso;
      @if (r.status() === 'error') {
        <p class="mc-falla" role="alert">{{ mensaje() }}</p>
        <div><button mat-stroked-button type="button" (click)="r.reload()">Reintentar</button></div>
      } @else if (!r.hasValue()) {
        <p role="status">Cargando…</p>
      } @else if (entrantes().length === 0) {
        <p class="mc-vacio">No hay viajes en camino.</p>
      } @else {
        <ul class="viajes">
          @for (viaje of entrantes(); track viaje.id) {
            <li>
              <strong>{{ viaje.codigo }}</strong> · {{ rotuloTramo[viaje.tramo] }}
              <span class="secundario">
                sale de {{ viaje.origenRazonSocial }} · llega aprox. {{ viaje.fechaEstimadaEntrega | fechaHora }} · bultos
                @for (c of viaje.bultoCodigos; track c) { <code>{{ c }}</code>{{ $last ? '' : ' ' }} }
              </span>
            </li>
          }
        </ul>
      }
    </mc-tarjeta>
  `,
  styles: `
    .viajes {
      display: grid;
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .secundario {
      display: block;
      color: var(--mc-texto-secundario);
      font-size: 0.875rem;
    }
  `,
})
export class ViajesEnCamino {
  private readonly api = inject(ViajesService);
  private readonly sesion = inject(SesionService);
  protected readonly rotuloTramo = ROTULO_TRAMO;

  protected readonly recurso = rxResource<DespachoLogisticoResponseDto[], undefined>({
    stream: () =>
      this.api
        .listarViajes({ estado: 'EN_TRANSITO', size: TAMANO_PAGINA_MAXIMO })
        .pipe(map((p) => p.content.filter((v) => v.origenId !== this.sesion.sesion()?.empresaId))),
  });

  protected readonly entrantes = computed(() => (this.recurso.hasValue() ? this.recurso.value() : []));

  protected readonly mensaje = computed(() => {
    const error: unknown = this.recurso.error();
    if (error instanceof ErrorApi) {
      return error.mensaje;
    }
    return error instanceof HttpErrorResponse ? parsearErrorApi(error).mensaje : 'No se pudieron cargar los viajes.';
  });

  recargar(): void {
    this.recurso.reload();
  }
}
