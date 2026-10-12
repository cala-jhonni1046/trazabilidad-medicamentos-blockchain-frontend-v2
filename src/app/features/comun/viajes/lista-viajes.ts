import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { ViajesService } from '../../../core/api/generado/services/viajes.service';
import { DespachoLogisticoResponseDto } from '../../../core/api/modelos';
import { Pagina } from '../../../core/api/pagina';
import { Resultado, aResultado } from '../../../core/api/resultado';
import { SesionService } from '../../../core/auth/sesion.service';
import { ErrorApi } from '../../../core/errores/error-api';
import { ListaPaginada } from '../../../core/listas/lista-paginada';
import { NombresService } from '../../../core/nombres/nombres.service';
import { proveerPaginadorEs } from '../../../core/tema/paginador-es';
import { PRESENTACION_ESTADO_VIAJE } from '../../../shared/estados/catalogo-estados';
import { Estado } from '../../../shared/estados/estado';
import { ROTULO_TRAMO } from '../../../shared/formato/etiquetas';
import { FechaHoraPipe } from '../../../shared/formato/pipes-fechas';
import { ErrorApiComponente } from '../../../shared/ui/error-api';
import { GraficoTemperatura, LecturaTemperatura } from '../../../shared/ui/grafico-temperatura';
import { Tarjeta } from '../../../shared/ui/tarjeta';
import { ViajesAcciones } from './viajes.acciones';

/** Un viaje con el nombre de su empresa de origen. */
export interface ViajeVista {
  readonly viaje: DespachoLogisticoResponseDto;
  readonly origen: string;
}

/** Temperaturas de un viaje: cargando, las lecturas o el error. */
interface TemperaturasAbiertas {
  readonly id: string;
  readonly lecturas: readonly LecturaTemperatura[] | null;
  readonly error: ErrorApi | null;
}

/**
 * Listado de viajes con las acciones de la empresa de origen (salida, cancelar, robo) y las
 * temperaturas del viaje. Los ve también la empresa receptora, sin acciones.
 * TODO B12: `listarViajes` no filtra por estado ni da el nombre del origen (docs/pedidos-b12.md, puntos 7 y 8).
 */
@Component({
  selector: 'mc-lista-viajes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ErrorApiComponente, Estado, FechaHoraPipe, GraficoTemperatura, MatButtonModule, MatPaginatorModule, Tarjeta],
  providers: [...proveerPaginadorEs()],
  templateUrl: './lista-viajes.html',
})
export class ListaViajes {
  private readonly api = inject(ViajesService);
  private readonly nombres = inject(NombresService);
  private readonly acciones = inject(ViajesAcciones);
  private readonly sesion = inject(SesionService);

  protected readonly presentacion = PRESENTACION_ESTADO_VIAJE;
  protected readonly rotuloTramo = ROTULO_TRAMO;
  private readonly empresaId = computed(() => this.sesion.sesion()?.empresaId ?? null);

  protected readonly lista = new ListaPaginada<ViajeVista>(null, ({ pagina, tamano }) =>
    this.api.listarViajes({ page: pagina, size: tamano }).pipe(switchMap((p) => this.completar(p))),
  );

  protected readonly ocupado = signal(false);
  protected readonly temperaturas = signal<TemperaturasAbiertas | null>(null);

  /** True si la empresa del usuario es el origen del viaje (solo ella ve las acciones; la API decide). */
  protected esOrigen(v: ViajeVista): boolean {
    return v.viaje.origenId === this.empresaId();
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

  protected salida = (v: ViajeVista) => this.ejecutar(this.acciones.salida(v.viaje));
  protected cancelar = (v: ViajeVista) => this.ejecutar(this.acciones.cancelar(v.viaje));
  protected robo = (v: ViajeVista) => this.ejecutar(this.acciones.robo(v.viaje));

  /** Muestra u oculta las temperaturas del viaje (hasta 100 lecturas por pedido). */
  protected async verTemperaturas(v: ViajeVista): Promise<void> {
    if (this.temperaturas()?.id === v.viaje.id) {
      this.temperaturas.set(null);
      return;
    }
    this.temperaturas.set({ id: v.viaje.id, lecturas: null, error: null });
    const resultado: Resultado<readonly LecturaTemperatura[]> = await aResultado(
      this.api.listarTemperaturasDelViaje({ id: v.viaje.id, size: 100 }).pipe(map((p) => p.content)),
    );
    this.temperaturas.set(
      resultado.ok ? { id: v.viaje.id, lecturas: resultado.valor, error: null } : { id: v.viaje.id, lecturas: null, error: resultado.error },
    );
  }

  private completar(pagina: Pagina<DespachoLogisticoResponseDto>): Observable<Pagina<ViajeVista>> {
    if (pagina.content.length === 0) {
      return of({ content: [], page: pagina.page });
    }
    return forkJoin(
      pagina.content.map((viaje) =>
        this.nombres.empresa(viaje.origenId).pipe(map((e): ViajeVista => ({ viaje, origen: e?.razonSocial ?? '(sin datos)' }))),
      ),
    ).pipe(map((content) => ({ content, page: pagina.page })));
  }
}
