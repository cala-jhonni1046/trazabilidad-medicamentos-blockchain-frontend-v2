import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { ViajesService } from '../../../core/api/generado/services/viajes.service';
import { DespachoLogisticoResponseDto } from '../../../core/api/modelos';
import { TAMANO_PAGINA_MAXIMO } from '../../../core/api/pagina';
import { SesionService } from '../../../core/auth/sesion.service';
import { ErrorApi, parsearErrorApi } from '../../../core/errores/error-api';
import { NombresService } from '../../../core/nombres/nombres.service';
import { ROTULO_TRAMO } from '../../../shared/formato/etiquetas';
import { FechaHoraPipe } from '../../../shared/formato/pipes-fechas';
import { Tarjeta } from '../../../shared/ui/tarjeta';
import { HttpErrorResponse } from '@angular/common/http';

/** Un viaje en tránsito hacia la empresa, con el nombre de su origen. */
interface ViajeEntrante {
  readonly viaje: DespachoLogisticoResponseDto;
  readonly origen: string;
}

/**
 * "En camino hacia vos": los viajes en tránsito que tienen como destino a la empresa.
 * TODO B12: `listarViajes` no filtra por estado (se pide hasta 100 y se filtra acá) y no dice qué
 * bultos del viaje son de esta empresa (docs/pedidos-b12.md, punto 8).
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
          @for (e of entrantes(); track e.viaje.id) {
            <li>
              <strong>{{ e.viaje.codigo }}</strong> · {{ rotuloTramo[e.viaje.tramo] }}
              <span class="secundario">
                sale de {{ e.origen }} · llega aprox. {{ e.viaje.fechaEstimadaEntrega | fechaHora }} · bultos
                @for (c of e.viaje.bultoCodigos; track c) { <code>{{ c }}</code>{{ $last ? '' : ' ' }} }
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
  private readonly nombres = inject(NombresService);
  private readonly sesion = inject(SesionService);
  protected readonly rotuloTramo = ROTULO_TRAMO;

  protected readonly recurso = rxResource<ViajeEntrante[], undefined>({
    stream: () =>
      this.api.listarViajes({ size: TAMANO_PAGINA_MAXIMO }).pipe(
        map((p) => p.content.filter((v) => v.estado === 'EN_TRANSITO' && v.origenId !== this.sesion.sesion()?.empresaId)),
        switchMap((viajes) =>
          viajes.length === 0
            ? of<ViajeEntrante[]>([])
            : forkJoin(viajes.map((viaje) => this.nombres.empresa(viaje.origenId).pipe(map((e): ViajeEntrante => ({ viaje, origen: e?.razonSocial ?? '(sin datos)' }))))),
        ),
      ),
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
