import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { map } from 'rxjs';
import { CuarentenasService } from '../../../core/api/generado/services/cuarentenas.service';
import { CuarentenaResponseDto, ESTADO_CUARENTENA, EstadoCuarentena } from '../../../core/api/modelos';
import { Pagina } from '../../../core/api/pagina';
import { SesionService } from '../../../core/auth/sesion.service';
import { ListaPaginada } from '../../../core/listas/lista-paginada';
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

/** Una medida con una descripción corta de a qué apunta. */
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
    return origen.pipe(map((p): Pagina<MedidaVista> => ({ content: p.content.map(describir), page: p.page })));
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
}

/** A qué apunta la medida: el lote por su código (viene en la respuesta), el viaje o los bultos. */
function describir(medida: CuarentenaResponseDto): MedidaVista {
  if (medida.alcance === 'LOTE') {
    return { medida, objetivo: `Lote ${medida.loteCodigo ?? '(sin datos)'}` };
  }
  const n = medida.bultoIds.length;
  return { medida, objetivo: medida.alcance === 'DESPACHO' ? `Viaje (${n} bultos)` : `${n} bulto${n === 1 ? '' : 's'}` };
}
