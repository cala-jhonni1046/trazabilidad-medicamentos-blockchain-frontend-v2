import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { BultosService } from '../../../core/api/generado/services/bultos.service';
import { BultoResponseDto, ESTADO_BULTO, EstadoBulto } from '../../../core/api/modelos';

import { aResultado } from '../../../core/api/resultado';
import { SesionService } from '../../../core/auth/sesion.service';
import { ListaPaginada } from '../../../core/listas/lista-paginada';
import { proveerPaginadorEs } from '../../../core/tema/paginador-es';
import { PRESENTACION_ESTADO_BULTO, opcionesDeEstado } from '../../../shared/estados/catalogo-estados';
import { Estado } from '../../../shared/estados/estado';
import { ErrorApiComponente } from '../../../shared/ui/error-api';
import { EjecutorAcciones } from '../../../shared/ui/ejecutor-acciones';
import { FiltroEstado } from '../../../shared/ui/filtro-estado';
import { Tarjeta } from '../../../shared/ui/tarjeta';

/** Qué bultos lista: todos los del laboratorio (con filtro) o los que están en el depósito de la distribuidora. */
export type ModoListaBultos = 'laboratorio' | 'deposito';

/**
 * Listado de bultos. El laboratorio ve los suyos, filtra por estado y desarma los ARMADO; la
 * distribuidora ve los que tiene en su depósito. El indicador de bloqueo (R10) es el del backend.
 * Lote, circuito, distribuidora y farmacia vienen con su nombre en cada bulto (`destinoId` es el id del
 * CIRCUITO, no de una empresa).
 */
@Component({
  selector: 'mc-lista-bultos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ErrorApiComponente, Estado, FiltroEstado, MatButtonModule, MatPaginatorModule, Tarjeta],
  providers: [...proveerPaginadorEs()],
  templateUrl: './lista-bultos.html',
})
export class ListaBultos {
  private readonly api = inject(BultosService);
  private readonly ejecutor = inject(EjecutorAcciones);
  private readonly sesion = inject(SesionService);

  readonly modo = input<ModoListaBultos>('laboratorio');
  readonly titulo = input('Bultos');

  protected readonly presentacion = PRESENTACION_ESTADO_BULTO;
  protected readonly opciones = opcionesDeEstado(ESTADO_BULTO, PRESENTACION_ESTADO_BULTO);
  protected readonly esLaboratorio = computed(() => this.sesion.sesion()?.rol === 'LABORATORIO');

  protected readonly lista = new ListaPaginada<BultoResponseDto, EstadoBulto | null>(null, ({ pagina, tamano, filtro }) => {
    const estado: EstadoBulto | null = this.modo() === 'deposito' ? 'EN_DEPOSITO' : filtro;
    return this.api.listarBultos({ page: pagina, size: tamano, ...(estado === null ? {} : { estado }) });
  });

  protected readonly ocupada = signal(false);

  /** Refresca el listado desde afuera (por ejemplo, después de armar un bulto). */
  recargar(): void {
    this.lista.recargar();
  }

  protected cambiarPagina(evento: PageEvent): void {
    this.lista.irA(evento.pageIndex, evento.pageSize);
  }

  protected async desarmar(bulto: BultoResponseDto): Promise<void> {
    this.ocupada.set(true);
    const hecho = await this.ejecutor.conDialogo(
      {
        titulo: 'Desarmar el bulto',
        detalle: bulto.codigo,
        aviso: 'Sus cajas quedan libres en el laboratorio.',
        boton: 'Desarmar',
        accion: () => aResultado(this.api.desarmarBulto({ id: bulto.id })),
      },
      `Bulto ${bulto.codigo} desarmado.`,
    );
    if (hecho) {
      this.lista.recargar();
    }
    this.ocupada.set(false);
  }
}
