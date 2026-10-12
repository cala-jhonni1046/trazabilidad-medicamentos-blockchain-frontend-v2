import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { CuarentenasService } from '../../../core/api/generado/services/cuarentenas.service';
import { CuarentenaResponseDto, ESTADO_CUARENTENA, EstadoCuarentena } from '../../../core/api/modelos';
import { Pagina } from '../../../core/api/pagina';
import { SesionService } from '../../../core/auth/sesion.service';
import { ListaPaginada } from '../../../core/listas/lista-paginada';
import { NombresService } from '../../../core/nombres/nombres.service';
import { proveerPaginadorEs } from '../../../core/tema/paginador-es';
import { PRESENTACION_ESTADO_CUARENTENA, opcionesDeEstado } from '../../../shared/estados/catalogo-estados';
import { Estado } from '../../../shared/estados/estado';
import { ROTULO_ALCANCE, ROTULO_MOTIVO_MEDIDA, ROTULO_PROVINCIA } from '../../../shared/formato/etiquetas';
import { FechaHoraPipe } from '../../../shared/formato/pipes-fechas';
import { ErrorApiComponente } from '../../../shared/ui/error-api';
import { FiltroEstado } from '../../../shared/ui/filtro-estado';
import { Tarjeta } from '../../../shared/ui/tarjeta';
import { MedidasAcciones } from './medidas.acciones';

/** Qué medidas lista: las que ve el usuario, o la bandeja del inspector. */
export type ModoListaMedidas = 'todas' | 'bandeja';

/** Una medida con el código del lote al que apunta (si es de alcance LOTE). */
export interface MedidaVista {
  readonly medida: CuarentenaResponseDto;
  /** "Lote L2026-0001", "Viaje" o "3 bultos". */
  readonly objetivo: string;
}

/** Listado de medidas sanitarias (cuarentenas y recalls) con las acciones del inspector. */
@Component({
  selector: 'mc-lista-medidas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ErrorApiComponente, Estado, FechaHoraPipe, FiltroEstado, MatButtonModule, MatPaginatorModule, Tarjeta],
  providers: [...proveerPaginadorEs()],
  templateUrl: './lista-medidas.html',
})
export class ListaMedidas {
  private readonly api = inject(CuarentenasService);
  private readonly nombres = inject(NombresService);
  private readonly acciones = inject(MedidasAcciones);
  private readonly sesion = inject(SesionService);

  readonly modo = input<ModoListaMedidas>('todas');
  readonly titulo = input('Cuarentenas y recalls');

  protected readonly presentacion = PRESENTACION_ESTADO_CUARENTENA;
  protected readonly opciones = opcionesDeEstado(ESTADO_CUARENTENA, PRESENTACION_ESTADO_CUARENTENA);
  protected readonly rotuloAlcance = ROTULO_ALCANCE;
  protected readonly rotuloMotivo = ROTULO_MOTIVO_MEDIDA;
  protected readonly rotuloProvincia = ROTULO_PROVINCIA;
  protected readonly esInspector = computed(() => this.sesion.sesion()?.rol === 'INSPECTOR');

  protected readonly lista = new ListaPaginada<MedidaVista, EstadoCuarentena | null>(null, ({ pagina, tamano, filtro }) => {
    const parametros = { page: pagina, size: tamano };
    const origen =
      this.modo() === 'bandeja'
        ? this.api.bandejaCuarentenas(parametros)
        : this.api.listarCuarentenas({ ...parametros, ...(filtro === null ? {} : { estado: filtro }) });
    return origen.pipe(switchMap((p) => this.completar(p)));
  });

  protected readonly ocupada = signal(false);

  protected cambiarPagina(evento: PageEvent): void {
    this.lista.irA(evento.pageIndex, evento.pageSize);
  }

  protected async ejecutar(accion: Promise<boolean>): Promise<void> {
    this.ocupada.set(true);
    if (await accion) {
      this.lista.recargar();
    }
    this.ocupada.set(false);
  }

  protected tomar = (v: MedidaVista) => this.ejecutar(this.acciones.tomar(v.medida));
  protected levantar = (v: MedidaVista) => this.ejecutar(this.acciones.levantar(v.medida, v.objetivo));
  protected recall = (v: MedidaVista) => this.ejecutar(this.acciones.recall(v.medida, v.objetivo));

  /** Busca el código del lote de las medidas de alcance LOTE (con caché). */
  private completar(pagina: Pagina<CuarentenaResponseDto>): Observable<Pagina<MedidaVista>> {
    if (pagina.content.length === 0) {
      return of({ content: [], page: pagina.page });
    }
    return forkJoin(
      pagina.content.map((medida) => {
        if (medida.alcance === 'LOTE' && medida.loteId != null) {
          return this.nombres.lote(medida.loteId).pipe(
            map((lote): MedidaVista => ({ medida, objetivo: `Lote ${lote?.codigo ?? '(sin datos)'}` })),
          );
        }
        const n = medida.bultoIds.length;
        return of<MedidaVista>({ medida, objetivo: medida.alcance === 'DESPACHO' ? `Viaje (${n} bultos)` : `${n} bulto${n === 1 ? '' : 's'}` });
      }),
    ).pipe(map((content) => ({ content, page: pagina.page })));
  }
}
