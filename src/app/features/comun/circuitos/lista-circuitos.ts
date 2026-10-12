import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { CircuitosService } from '../../../core/api/generado/services/circuitos.service';
import { ESTADO_ENLACE_CUIT, EnlaceCuitResponseDto, EstadoEnlaceCuit } from '../../../core/api/modelos';
import { Pagina } from '../../../core/api/pagina';
import { SesionService } from '../../../core/auth/sesion.service';
import { ListaPaginada } from '../../../core/listas/lista-paginada';
import { NombresService } from '../../../core/nombres/nombres.service';
import { proveerPaginadorEs } from '../../../core/tema/paginador-es';
import { PRESENTACION_ESTADO_CIRCUITO, opcionesDeEstado } from '../../../shared/estados/catalogo-estados';
import { Estado } from '../../../shared/estados/estado';
import { FechaHoraPipe } from '../../../shared/formato/pipes-fechas';
import { ErrorApiComponente } from '../../../shared/ui/error-api';
import { FiltroEstado } from '../../../shared/ui/filtro-estado';
import { Tarjeta } from '../../../shared/ui/tarjeta';
import { CircuitosAcciones } from './circuitos.acciones';

/** Qué circuitos lista: los que ve el usuario, la bandeja del inspector o los que esperan la aceptación de su empresa. */
export type ModoListaCircuitos = 'todos' | 'bandeja' | 'por-aceptar';

/** Un circuito con los nombres de sus tres empresas. */
export interface CircuitoVista {
  readonly circuito: EnlaceCuitResponseDto;
  readonly laboratorio: string;
  readonly distribuidor: string;
  readonly farmacia: string;
}

const SIN_NOMBRE = 'Empresa (sin datos)';

/**
 * Listado de circuitos con las acciones de cada rol: el inspector toma, aprueba, rechaza,
 * suspende y rehabilita; la Sede suspende y rehabilita; el administrador de una distribuidora
 * o farmacia acepta o rechaza. Las acciones salen del estado y el rol; la API decide.
 */
@Component({
  selector: 'mc-lista-circuitos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ErrorApiComponente, Estado, FechaHoraPipe, FiltroEstado, MatButtonModule, MatPaginatorModule, Tarjeta],
  providers: [...proveerPaginadorEs()],
  templateUrl: './lista-circuitos.html',
})
export class ListaCircuitos {
  private readonly api = inject(CircuitosService);
  private readonly nombres = inject(NombresService);
  private readonly acciones = inject(CircuitosAcciones);
  private readonly sesion = inject(SesionService);

  readonly modo = input<ModoListaCircuitos>('todos');
  readonly titulo = input('Circuitos');

  protected readonly presentacion = PRESENTACION_ESTADO_CIRCUITO;
  protected readonly opciones = opcionesDeEstado(ESTADO_ENLACE_CUIT, PRESENTACION_ESTADO_CIRCUITO);

  protected readonly rol = computed(() => this.sesion.sesion()?.rol ?? null);
  protected readonly esAdminEmpresa = computed(() => this.sesion.sesion()?.esAdminEmpresa === true);

  protected readonly lista = new ListaPaginada<CircuitoVista, EstadoEnlaceCuit | null>(null, ({ pagina, tamano, filtro }) => {
    const parametros = { page: pagina, size: tamano };
    const origen =
      this.modo() === 'bandeja'
        ? this.api.bandejaCircuitos(parametros)
        : this.modo() === 'por-aceptar'
          ? this.api.listarCircuitosPendientesDeAceptacion(parametros)
          : this.api.listarCircuitos({ ...parametros, ...(filtro === null ? {} : { estado: filtro }) });
    return origen.pipe(switchMap((p) => this.completar(p)));
  });

  protected readonly ocupada = signal(false);

  protected cambiarPagina(evento: PageEvent): void {
    this.lista.irA(evento.pageIndex, evento.pageSize);
  }

  /** Refresca el listado desde afuera (por ejemplo, después de proponer un circuito). */
  recargar(): void {
    this.lista.recargar();
  }

  /** True si la empresa del usuario ya aceptó este circuito (distribuidora o farmacia). */
  protected yaAcepto(c: EnlaceCuitResponseDto): boolean {
    return this.rol() === 'DISTRIBUIDOR' ? c.fechaAceptacionDistribuidor != null : c.fechaAceptacionFarmacia != null;
  }

  protected async ejecutar(accion: Promise<boolean>): Promise<void> {
    this.ocupada.set(true);
    if (await accion) {
      this.lista.recargar();
    }
    this.ocupada.set(false);
  }

  protected tomar = (c: EnlaceCuitResponseDto) => this.ejecutar(this.acciones.tomar(c));
  protected aprobar = (c: EnlaceCuitResponseDto) => this.ejecutar(this.acciones.aprobar(c));
  protected rechazar = (c: EnlaceCuitResponseDto) => this.ejecutar(this.acciones.rechazar(c));
  protected suspender = (c: EnlaceCuitResponseDto) => this.ejecutar(this.acciones.suspender(c));
  protected rehabilitar = (c: EnlaceCuitResponseDto) => this.ejecutar(this.acciones.rehabilitar(c));
  protected aceptar = (c: EnlaceCuitResponseDto) => this.ejecutar(this.acciones.aceptar(c));
  protected rechazarPorEmpresa = (c: EnlaceCuitResponseDto) => this.ejecutar(this.acciones.rechazarPorEmpresa(c));

  /** Agrega los nombres de las tres empresas (con caché) a cada circuito de la página. */
  private completar(pagina: Pagina<EnlaceCuitResponseDto>): Observable<Pagina<CircuitoVista>> {
    if (pagina.content.length === 0) {
      return of({ content: [], page: pagina.page });
    }
    return forkJoin(
      pagina.content.map((circuito) =>
        forkJoin({
          laboratorio: this.nombres.empresa(circuito.laboratorioId),
          distribuidor: this.nombres.empresa(circuito.distribuidorId),
          farmacia: this.nombres.empresa(circuito.farmaciaId),
        }).pipe(
          map(
            (e): CircuitoVista => ({
              circuito,
              laboratorio: e.laboratorio?.razonSocial ?? SIN_NOMBRE,
              distribuidor: e.distribuidor?.razonSocial ?? SIN_NOMBRE,
              farmacia: e.farmacia?.razonSocial ?? SIN_NOMBRE,
            }),
          ),
        ),
      ),
    ).pipe(map((content) => ({ content, page: pagina.page })));
  }
}
