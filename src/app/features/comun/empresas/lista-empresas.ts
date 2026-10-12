import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ESTADO_HABILITACION, EmpresaResponseDto, EstadoHabilitacion } from '../../../core/api/modelos';
import { SesionService } from '../../../core/auth/sesion.service';
import { ListaPaginada } from '../../../core/listas/lista-paginada';
import { proveerPaginadorEs } from '../../../core/tema/paginador-es';
import { PRESENTACION_ESTADO_HABILITACION, opcionesDeEstado } from '../../../shared/estados/catalogo-estados';
import { Estado } from '../../../shared/estados/estado';
import { ROTULO_PROVINCIA, ROTULO_TIPO_EMPRESA } from '../../../shared/formato/etiquetas';
import { FechaHoraPipe } from '../../../shared/formato/pipes-fechas';
import { ErrorApiComponente } from '../../../shared/ui/error-api';
import { FiltroEstado } from '../../../shared/ui/filtro-estado';
import { Icono } from '../../../shared/ui/icono';
import { Tarjeta } from '../../../shared/ui/tarjeta';
import { EmpresasAcciones } from './empresas.acciones';
import { EmpresasService } from '../../../core/api/generado/services/empresas.service';

/** Qué empresas lista: todas las que ve el usuario, o su bandeja de solicitudes (inspector). */
export type ModoListaEmpresas = 'todas' | 'bandeja';

/**
 * Listado de empresas con sus acciones: el inspector toma, habilita o rechaza solicitudes; la
 * Sede suspende y rehabilita; ambos pueden bajar el PDF de habilitación.
 * Las acciones que se ofrecen salen del estado y del rol; la API decide si corresponden.
 */
@Component({
  selector: 'mc-lista-empresas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ErrorApiComponente, Estado, FechaHoraPipe, FiltroEstado, Icono, MatButtonModule, MatPaginatorModule, Tarjeta],
  providers: [...proveerPaginadorEs()],
  templateUrl: './lista-empresas.html',
})
export class ListaEmpresas {
  private readonly api = inject(EmpresasService);
  private readonly acciones = inject(EmpresasAcciones);
  private readonly sesion = inject(SesionService);

  readonly modo = input<ModoListaEmpresas>('todas');
  readonly titulo = input('Empresas');

  protected readonly rotuloProvincia = ROTULO_PROVINCIA;
  protected readonly rotuloTipo = ROTULO_TIPO_EMPRESA;
  protected readonly presentacion = PRESENTACION_ESTADO_HABILITACION;
  protected readonly opciones = opcionesDeEstado(ESTADO_HABILITACION, PRESENTACION_ESTADO_HABILITACION);

  protected readonly rol = computed(() => this.sesion.sesion()?.rol ?? null);
  protected readonly esInspector = computed(() => this.rol() === 'INSPECTOR');
  protected readonly esSede = computed(() => this.rol() === 'SEDE_CENTRAL');

  protected readonly lista = new ListaPaginada<EmpresaResponseDto, EstadoHabilitacion | null>(null, ({ pagina, tamano, filtro }) =>
    this.modo() === 'bandeja'
      ? this.api.bandejaEmpresas({ page: pagina, size: tamano })
      : this.api.listarEmpresas({ page: pagina, size: tamano, ...(filtro === null ? {} : { estado: filtro }) }),
  );

  protected readonly ocupada = signal(false);

  protected cambiarPagina(evento: PageEvent): void {
    this.lista.irA(evento.pageIndex, evento.pageSize);
  }

  /** Ejecuta una acción y, si la API la aceptó, recarga el listado. */
  protected async ejecutar(accion: Promise<boolean>): Promise<void> {
    this.ocupada.set(true);
    if (await accion) {
      this.lista.recargar();
    }
    this.ocupada.set(false);
  }

  protected tomar = (e: EmpresaResponseDto) => this.ejecutar(this.acciones.tomar(e));
  protected habilitar = (e: EmpresaResponseDto) => this.ejecutar(this.acciones.habilitar(e));
  protected rechazar = (e: EmpresaResponseDto) => this.ejecutar(this.acciones.rechazar(e));
  protected suspender = (e: EmpresaResponseDto) => this.ejecutar(this.acciones.suspender(e));
  protected rehabilitar = (e: EmpresaResponseDto) => this.ejecutar(this.acciones.rehabilitar(e));
  protected documento = (e: EmpresaResponseDto) => this.acciones.descargarDocumento(e);
}
