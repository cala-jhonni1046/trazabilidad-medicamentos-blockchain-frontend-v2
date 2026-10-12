import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { LotesService } from '../../../core/api/generado/services/lotes.service';
import { ESTADO_LOTE, EstadoLote, LoteResponseDto } from '../../../core/api/modelos';
import { Pagina } from '../../../core/api/pagina';
import { SesionService } from '../../../core/auth/sesion.service';
import { ListaPaginada } from '../../../core/listas/lista-paginada';
import { NombresService } from '../../../core/nombres/nombres.service';
import { proveerPaginadorEs } from '../../../core/tema/paginador-es';
import { PRESENTACION_ESTADO_LOTE, opcionesDeEstado } from '../../../shared/estados/catalogo-estados';
import { Estado } from '../../../shared/estados/estado';
import { DiaPipe } from '../../../shared/formato/pipes-fechas';
import { ErrorApiComponente } from '../../../shared/ui/error-api';
import { FiltroEstado } from '../../../shared/ui/filtro-estado';
import { Tarjeta } from '../../../shared/ui/tarjeta';
import { LotesAcciones } from './lotes.acciones';

/** Qué lotes lista: los que ve el usuario, o la bandeja de liberación de biológicos (inspector). */
export type ModoListaLotes = 'todos' | 'bandeja-liberacion';

/** Un lote con el nombre de su medicamento y de su laboratorio. */
export interface LoteVista {
  readonly lote: LoteResponseDto;
  readonly medicamento: string;
  readonly laboratorio: string;
}

const SIN_NOMBRE = '(sin datos)';

/**
 * Listado de lotes con las acciones del inspector: liberar un biológico y abrir una cuarentena.
 * Muestra el indicador de bloqueo R10 tal como lo calcula el backend.
 */
@Component({
  selector: 'mc-lista-lotes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DiaPipe, ErrorApiComponente, Estado, FiltroEstado, MatButtonModule, MatPaginatorModule, Tarjeta],
  providers: [...proveerPaginadorEs()],
  templateUrl: './lista-lotes.html',
})
export class ListaLotes {
  private readonly api = inject(LotesService);
  private readonly nombres = inject(NombresService);
  private readonly acciones = inject(LotesAcciones);
  private readonly sesion = inject(SesionService);

  readonly modo = input<ModoListaLotes>('todos');
  readonly titulo = input('Lotes');

  protected readonly presentacion = PRESENTACION_ESTADO_LOTE;
  protected readonly opciones = opcionesDeEstado(ESTADO_LOTE, PRESENTACION_ESTADO_LOTE);
  protected readonly esInspector = computed(() => this.sesion.sesion()?.rol === 'INSPECTOR');
  protected readonly esDirectorTecnico = computed(() => this.sesion.sesion()?.rol === 'LABORATORIO' && this.sesion.sesion()?.esDirectorTecnico === true);

  protected readonly lista = new ListaPaginada<LoteVista, EstadoLote | null>(null, ({ pagina, tamano, filtro }) => {
    const parametros = { page: pagina, size: tamano };
    const origen =
      this.modo() === 'bandeja-liberacion'
        ? this.api.bandejaLiberacionLotes(parametros)
        : this.api.listarLotes({ ...parametros, ...(filtro === null ? {} : { estado: filtro }) });
    return origen.pipe(switchMap((p) => this.completar(p)));
  });

  protected readonly ocupada = signal(false);

  /** Refresca el listado desde afuera (por ejemplo, después de registrar un lote). */
  recargar(): void {
    this.lista.recargar();
  }

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

  protected liberar = (l: LoteResponseDto) => this.ejecutar(this.acciones.liberar(l));
  protected cuarentena = (l: LoteResponseDto) => this.ejecutar(this.acciones.ponerEnCuarentena(l));

  /** Agrega el nombre del medicamento y del laboratorio (con caché). */
  private completar(pagina: Pagina<LoteResponseDto>): Observable<Pagina<LoteVista>> {
    if (pagina.content.length === 0) {
      return of({ content: [], page: pagina.page });
    }
    return forkJoin(
      pagina.content.map((lote) =>
        forkJoin({
          medicamento: this.nombres.medicamento(lote.medicamentoId),
          laboratorio: this.nombres.empresa(lote.laboratorioId),
        }).pipe(
          map((n): LoteVista => ({
            lote,
            medicamento: n.medicamento?.nombreComercial ?? SIN_NOMBRE,
            laboratorio: n.laboratorio?.razonSocial ?? SIN_NOMBRE,
          })),
        ),
      ),
    ).pipe(map((content) => ({ content, page: pagina.page })));
  }
}
