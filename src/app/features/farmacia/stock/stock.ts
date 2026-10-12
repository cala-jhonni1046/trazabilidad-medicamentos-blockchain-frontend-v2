import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { UnidadesTrazablesService } from '../../../core/api/generado/services/unidades-trazables.service';
import { MOTIVO_DEVOLUCION, MotivoDevolucion, UnidadTrazableResponseDto } from '../../../core/api/modelos';
import { Pagina } from '../../../core/api/pagina';
import { aResultado } from '../../../core/api/resultado';
import { ListaPaginada } from '../../../core/listas/lista-paginada';
import { NombresService } from '../../../core/nombres/nombres.service';
import { proveerPaginadorEs } from '../../../core/tema/paginador-es';
import { PRESENTACION_ESTADO_UNIDAD } from '../../../shared/estados/catalogo-estados';
import { Estado } from '../../../shared/estados/estado';
import { ROTULO_MOTIVO_DEVOLUCION } from '../../../shared/formato/etiquetas';
import { ErrorApiComponente } from '../../../shared/ui/error-api';
import { EjecutorAcciones } from '../../../shared/ui/ejecutor-acciones';
import { Tarjeta } from '../../../shared/ui/tarjeta';

/** Una caja con el código de su lote y el nombre de su medicamento. */
interface CajaVista {
  readonly caja: UnidadTrazableResponseDto;
  readonly lote: string;
  readonly medicamento: string;
}

const SIN_NOMBRE = '(sin datos)';

/**
 * "Stock" de la farmacia: las cajas que ve (en stock, dispensadas, devueltas…) con el estado y
 * el bloqueo R10 tal como los calcula el backend, y la devolución de una caja EN_STOCK.
 * TODO B12: `listarCajas` no filtra por estado (docs/pedidos-b12.md, punto 8): se muestra la
 * página con su estado y no se puede pedir "solo en stock".
 */
@Component({
  selector: 'mc-stock',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ErrorApiComponente, Estado, MatButtonModule, MatPaginatorModule, Tarjeta],
  providers: [...proveerPaginadorEs()],
  templateUrl: './stock.html',
  styles: `
    :host {
      display: grid;
      gap: 16px;
    }
  `,
})
export class Stock {
  private readonly api = inject(UnidadesTrazablesService);
  private readonly nombres = inject(NombresService);
  private readonly ejecutor = inject(EjecutorAcciones);

  protected readonly presentacion = PRESENTACION_ESTADO_UNIDAD;

  protected readonly lista = new ListaPaginada<CajaVista>(null, ({ pagina, tamano }) =>
    this.api.listarCajas({ page: pagina, size: tamano }).pipe(switchMap((p) => this.completar(p))),
  );

  protected readonly ocupada = signal(false);

  protected cambiarPagina(evento: PageEvent): void {
    this.lista.irA(evento.pageIndex, evento.pageSize);
  }

  /** Devuelve una caja EN_STOCK (queda DEVUELTA y no vuelve a dispensarse). */
  protected async devolver(v: CajaVista): Promise<void> {
    this.ocupada.set(true);
    const hecho = await this.ejecutor.conDialogo(
      {
        titulo: 'Devolver la caja',
        detalle: `${v.medicamento} · serie ${v.caja.serie}`,
        aviso: 'Queda devuelta y no vuelve a dispensarse.',
        selector: { etiqueta: 'Motivo', opciones: MOTIVO_DEVOLUCION.map((valor) => ({ valor, texto: ROTULO_MOTIVO_DEVOLUCION[valor] })) },
        campo: { etiqueta: 'Observación', obligatorio: false },
        boton: 'Devolver',
        accion: (observacion, motivo) =>
          aResultado(
            this.api.devolverCaja({
              body: { gtin: v.caja.gtin, serie: v.caja.serie, motivo: motivo as MotivoDevolucion, ...(observacion === '' ? {} : { observacion }) },
            }),
          ),
      },
      `Caja ${v.caja.serie} devuelta.`,
    );
    if (hecho) {
      this.lista.recargar();
    }
    this.ocupada.set(false);
  }

  private completar(pagina: Pagina<UnidadTrazableResponseDto>): Observable<Pagina<CajaVista>> {
    if (pagina.content.length === 0) {
      return of({ content: [], page: pagina.page });
    }
    return forkJoin(
      pagina.content.map((caja) =>
        this.nombres.lote(caja.loteId).pipe(
          switchMap((lote) =>
            (lote === null ? of(null) : this.nombres.medicamento(lote.medicamentoId)).pipe(
              map((m): CajaVista => ({ caja, lote: lote?.codigo ?? SIN_NOMBRE, medicamento: m?.nombreComercial ?? SIN_NOMBRE })),
            ),
          ),
        ),
      ),
    ).pipe(map((content) => ({ content, page: pagina.page })));
  }
}
