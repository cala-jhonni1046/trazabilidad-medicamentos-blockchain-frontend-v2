import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { map } from 'rxjs';
import { ViajesService } from '../../../core/api/generado/services/viajes.service';
import { DespachoLogisticoResponseDto, ESTADO_DESPACHO, EstadoDespacho } from '../../../core/api/modelos';

import { Resultado, aResultado } from '../../../core/api/resultado';
import { SesionService } from '../../../core/auth/sesion.service';
import { ErrorApi } from '../../../core/errores/error-api';
import { ListaPaginada } from '../../../core/listas/lista-paginada';
import { proveerPaginadorEs } from '../../../core/tema/paginador-es';
import { PRESENTACION_ESTADO_VIAJE, opcionesDeEstado } from '../../../shared/estados/catalogo-estados';
import { Estado } from '../../../shared/estados/estado';
import { ROTULO_TRAMO } from '../../../shared/formato/etiquetas';
import { FechaHoraPipe } from '../../../shared/formato/pipes-fechas';
import { ErrorApiComponente } from '../../../shared/ui/error-api';
import { FiltroEstado } from '../../../shared/ui/filtro-estado';
import { GraficoTemperatura, LecturaTemperatura } from '../../../shared/ui/grafico-temperatura';
import { Tarjeta } from '../../../shared/ui/tarjeta';
import { ViajesAcciones } from './viajes.acciones';

/** Temperaturas de un viaje: cargando, las lecturas o el error. */
interface TemperaturasAbiertas {
  readonly id: string;
  readonly lecturas: readonly LecturaTemperatura[] | null;
  readonly error: ErrorApi | null;
}

/**
 * Listado de viajes con las acciones de la empresa de origen (salida, cancelar, robo) y las
 * temperaturas del viaje. Los ve también la empresa receptora, sin acciones.
 * Se puede filtrar por estado (el filtro lo aplica la API dentro de lo que cada rol ve) y cada viaje trae
 * el nombre de su origen.
 */
@Component({
  selector: 'mc-lista-viajes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ErrorApiComponente, Estado, FechaHoraPipe, FiltroEstado, GraficoTemperatura, MatButtonModule, MatPaginatorModule, Tarjeta],
  providers: [...proveerPaginadorEs()],
  templateUrl: './lista-viajes.html',
})
export class ListaViajes {
  private readonly api = inject(ViajesService);
  private readonly acciones = inject(ViajesAcciones);
  private readonly sesion = inject(SesionService);

  protected readonly presentacion = PRESENTACION_ESTADO_VIAJE;
  protected readonly rotuloTramo = ROTULO_TRAMO;
  protected readonly opciones = opcionesDeEstado(ESTADO_DESPACHO, PRESENTACION_ESTADO_VIAJE);
  private readonly empresaId = computed(() => this.sesion.sesion()?.empresaId ?? null);

  protected readonly lista = new ListaPaginada<DespachoLogisticoResponseDto, EstadoDespacho | null>(null, ({ pagina, tamano, filtro }) =>
    this.api.listarViajes({ page: pagina, size: tamano, ...(filtro === null ? {} : { estado: filtro }) }),
  );

  protected readonly ocupado = signal(false);
  protected readonly temperaturas = signal<TemperaturasAbiertas | null>(null);

  /** True si la empresa del usuario es el origen del viaje (solo ella ve las acciones; la API decide). */
  protected esOrigen(viaje: DespachoLogisticoResponseDto): boolean {
    return viaje.origenId === this.empresaId();
  }

  recargar(): void {
    this.lista.recargar();
  }

  protected cambiarPagina(evento: PageEvent): void {
    this.lista.irA(evento.pageIndex, evento.pageSize);
  }

  protected async ejecutar(accion: Promise<boolean>): Promise<void> {
    this.ocupado.set(true);
    if (await accion) {
      this.lista.recargar();
    }
    this.ocupado.set(false);
  }

  protected salida = (viaje: DespachoLogisticoResponseDto) => this.ejecutar(this.acciones.salida(viaje));
  protected cancelar = (viaje: DespachoLogisticoResponseDto) => this.ejecutar(this.acciones.cancelar(viaje));
  protected robo = (viaje: DespachoLogisticoResponseDto) => this.ejecutar(this.acciones.robo(viaje));

  /** Muestra u oculta las temperaturas del viaje (hasta 100 lecturas por pedido). */
  protected async verTemperaturas(viaje: DespachoLogisticoResponseDto): Promise<void> {
    if (this.temperaturas()?.id === viaje.id) {
      this.temperaturas.set(null);
      return;
    }
    this.temperaturas.set({ id: viaje.id, lecturas: null, error: null });
    const resultado: Resultado<readonly LecturaTemperatura[]> = await aResultado(
      this.api.listarTemperaturasDelViaje({ id: viaje.id, size: 100 }).pipe(map((p) => p.content)),
    );
    this.temperaturas.set(
      resultado.ok ? { id: viaje.id, lecturas: resultado.valor, error: null } : { id: viaje.id, lecturas: null, error: resultado.error },
    );
  }
}
