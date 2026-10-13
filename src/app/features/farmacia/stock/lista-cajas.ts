import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { UnidadesTrazablesService } from '../../../core/api/generado/services/unidades-trazables.service';
import { EstadoUnidad, MOTIVO_DEVOLUCION, MotivoDevolucion, UnidadTrazableResponseDto } from '../../../core/api/modelos';
import { aResultado } from '../../../core/api/resultado';
import { ListaPaginada } from '../../../core/listas/lista-paginada';
import { proveerPaginadorEs } from '../../../core/tema/paginador-es';
import { PRESENTACION_ESTADO_UNIDAD } from '../../../shared/estados/catalogo-estados';
import { Estado } from '../../../shared/estados/estado';
import { ROTULO_MOTIVO_DEVOLUCION } from '../../../shared/formato/etiquetas';
import { ErrorApiComponente } from '../../../shared/ui/error-api';
import { EjecutorAcciones } from '../../../shared/ui/ejecutor-acciones';
import { Tarjeta } from '../../../shared/ui/tarjeta';

/**
 * Una tarjeta del "Stock" de la farmacia: las cajas de UN estado (`?estado=` lo aplica la API dentro de lo
 * que la farmacia ya ve), con su paginador, el código del lote y el nombre del medicamento que trae cada
 * caja y el bloqueo R10 tal como lo calcula el backend. Solo ofrece "Devolver" si se lo pide (`devolvible`) y
 * la caja está EN_STOCK; la API decide si corresponde.
 */
@Component({
  selector: 'mc-lista-cajas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ErrorApiComponente, Estado, MatButtonModule, MatPaginatorModule, Tarjeta],
  providers: [...proveerPaginadorEs()],
  templateUrl: './lista-cajas.html',
  styles: `
    :host {
      display: grid;
      gap: 16px;
    }
  `,
})
export class ListaCajas {
  private readonly api = inject(UnidadesTrazablesService);
  private readonly ejecutor = inject(EjecutorAcciones);

  /** Estado de las cajas que lista (se manda como `?estado=`). */
  readonly estado = input.required<EstadoUnidad>();
  readonly titulo = input.required<string>();
  /** Qué decir cuando no hay ninguna. */
  readonly textoVacio = input.required<string>();
  /** Si se ofrece "Devolver" en las cajas EN_STOCK. */
  readonly devolvible = input(false);

  protected readonly presentacion = PRESENTACION_ESTADO_UNIDAD;

  protected readonly lista = new ListaPaginada<UnidadTrazableResponseDto>(null, ({ pagina, tamano }) =>
    this.api.listarCajas({ estado: this.estado(), page: pagina, size: tamano }),
  );

  protected readonly ocupada = signal(false);

  protected cambiarPagina(evento: PageEvent): void {
    this.lista.irA(evento.pageIndex, evento.pageSize);
  }

  /** Devuelve una caja EN_STOCK (queda DEVUELTA y no vuelve a dispensarse). */
  protected async devolver(caja: UnidadTrazableResponseDto): Promise<void> {
    this.ocupada.set(true);
    const hecho = await this.ejecutor.conDialogo(
      {
        titulo: 'Devolver la caja',
        detalle: `${caja.medicamentoNombre} · serie ${caja.serie}`,
        aviso: 'Queda devuelta y no vuelve a dispensarse.',
        selector: { etiqueta: 'Motivo', opciones: MOTIVO_DEVOLUCION.map((valor) => ({ valor, texto: ROTULO_MOTIVO_DEVOLUCION[valor] })) },
        campo: { etiqueta: 'Observación', obligatorio: false },
        boton: 'Devolver',
        accion: (observacion, motivo) =>
          aResultado(
            this.api.devolverCaja({
              body: { gtin: caja.gtin, serie: caja.serie, motivo: motivo as MotivoDevolucion, ...(observacion === '' ? {} : { observacion }) },
            }),
          ),
      },
      `Caja ${caja.serie} devuelta.`,
    );
    if (hecho) {
      this.lista.recargar();
    }
    this.ocupada.set(false);
  }
}
