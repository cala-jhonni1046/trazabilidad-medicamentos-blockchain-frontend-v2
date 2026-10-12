import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, Signal, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { CircuitosService } from '../../../core/api/generado/services/circuitos.service';
import { CuarentenasService } from '../../../core/api/generado/services/cuarentenas.service';
import { EmpresasService } from '../../../core/api/generado/services/empresas.service';
import { EventosDeTrazabilidadService } from '../../../core/api/generado/services/eventos-de-trazabilidad.service';
import { InspectoresAnmatService } from '../../../core/api/generado/services/inspectores-anmat.service';
import { RegistrosBlockchainService } from '../../../core/api/generado/services/registros-blockchain.service';
import {
  EmpresaResponseDto,
  EnlaceCuitResponseDto,
  Provincia,
} from '../../../core/api/modelos';
import { TAMANO_PAGINA_MAXIMO } from '../../../core/api/pagina';
import { Resultado, aResultado } from '../../../core/api/resultado';
import { ErrorApi, parsearErrorApi } from '../../../core/errores/error-api';
import { NombresService } from '../../../core/nombres/nombres.service';
import { Tono } from '../../../shared/estados/catalogo-estados';
import { EstadoCarga } from '../../../shared/ui/mosaico';

/** Cuántos pendientes se piden por lista (primera página). */
export const TAMANO_LISTA_PENDIENTES = 20;

/** A cuántos inspectores se les busca el nombre (el resto se muestra solo por legajo). */
export const MAXIMO_NOMBRES_INSPECTORES = 30;

/** Un mosaico del resumen, listo para mostrar. */
export interface MosaicoVista {
  readonly clave: string;
  readonly etiqueta: string;
  readonly valor: number | null;
  readonly estado: EstadoCarga;
  readonly tono: Tono | null;
}

/** Una página de pendientes con el total que hay en el backend. */
export interface ListaPendientes<T> {
  readonly elementos: readonly T[];
  readonly total: number;
}

/** Un circuito sin inspector con los nombres de sus tres empresas ya resueltos. */
export interface CircuitoPendiente {
  readonly circuito: EnlaceCuitResponseDto;
  readonly laboratorio: string;
  readonly distribuidor: string;
  readonly farmacia: string;
  /** Provincia de la farmacia (la que decide quién lo revisa); null si no se pudo leer. */
  readonly provinciaFarmacia: Provincia | null;
}

/** Un inspector activo que se puede elegir para asignar. */
export interface OpcionInspector {
  /** Id del inspector (lo que espera la API en `inspectorId`). */
  readonly id: string;
  readonly legajo: string;
  readonly provincia: Provincia;
  /** "Nombre Apellido", si se pudo buscar. */
  readonly nombre: string | null;
}

/** Texto cuando no se pudo leer el nombre de una empresa. */
const EMPRESA_SIN_NOMBRE = 'Empresa (sin datos)';

/** Definición de un mosaico: qué se cuenta y cuándo resaltarlo. */
interface DefinicionMosaico {
  readonly clave: string;
  readonly etiqueta: string;
  readonly contar: () => Observable<{ page: { totalElements: number } }>;
  /** Si hay algo (valor > 0) se resalta con este tono. */
  readonly tonoSiHay?: Tono;
}

/**
 * Datos del tablero de la Sede: el resumen en mosaicos, las listas de pendientes de asignar
 * y la asignación a un inspector. Lo provee la página (no es global).
 *
 * Cada mosaico y cada lista es un recurso independiente: si uno falla, los demás siguen.
 * Las decisiones (si se puede asignar o no, R2) las toma la API: acá solo se muestran sus errores.
 */
@Injectable()
export class TableroDatos {
  private readonly empresas = inject(EmpresasService);
  private readonly circuitos = inject(CircuitosService);
  private readonly inspectores = inject(InspectoresAnmatService);
  private readonly cuarentenas = inject(CuarentenasService);
  private readonly eventos = inject(EventosDeTrazabilidadService);
  private readonly anclajes = inject(RegistrosBlockchainService);
  private readonly nombres = inject(NombresService);

  /** Pedidos de solo conteo: `size=1` alcanza para leer `page.totalElements`. */
  private readonly definiciones: readonly DefinicionMosaico[] = [
    { clave: 'empresas', etiqueta: 'Empresas', contar: () => this.empresas.listarEmpresas({ size: 1 }) },
    {
      clave: 'empresas-pendientes',
      etiqueta: 'Empresas pendientes',
      contar: () => this.empresas.listarEmpresas({ estado: 'PENDIENTE', size: 1 }),
      tonoSiHay: 'atencion',
    },
    {
      clave: 'inspectores-activos',
      etiqueta: 'Inspectores activos',
      contar: () => this.inspectores.listarInspectores({ estado: 'ACTIVO', size: 1 }),
    },
    {
      clave: 'circuitos-aprobados',
      etiqueta: 'Circuitos aprobados',
      contar: () => this.circuitos.listarCircuitos({ estado: 'APROBADO', size: 1 }),
    },
    {
      clave: 'cuarentenas-activas',
      etiqueta: 'Cuarentenas activas',
      contar: () => this.cuarentenas.listarCuarentenas({ estado: 'ACTIVA', size: 1 }),
      tonoSiHay: 'atencion',
    },
    { clave: 'eventos', etiqueta: 'Eventos en la cadena', contar: () => this.eventos.listarEventos({ size: 1 }) },
    { clave: 'anclajes', etiqueta: 'Anclajes en Sepolia', contar: () => this.anclajes.listarAnclajes({ size: 1 }) },
  ];

  private readonly contadores = this.definiciones.map((definicion) => ({
    definicion,
    recurso: rxResource<number, undefined>({
      stream: () => definicion.contar().pipe(map((pagina) => pagina.page.totalElements)),
    }),
  }));

  /** Los mosaicos del resumen; uno que falla se marca "error" y no afecta a los demás. */
  readonly mosaicos: Signal<readonly MosaicoVista[]> = computed(() =>
    this.contadores.map(({ definicion, recurso }): MosaicoVista => {
      // value() lanza si el recurso está en error: se mira el estado antes.
      if (recurso.status() === 'error') {
        return { clave: definicion.clave, etiqueta: definicion.etiqueta, valor: null, estado: 'error', tono: null };
      }
      if (!recurso.hasValue()) {
        return { clave: definicion.clave, etiqueta: definicion.etiqueta, valor: null, estado: 'cargando', tono: null };
      }
      const valor = recurso.value();
      const tono = definicion.tonoSiHay !== undefined && valor > 0 ? definicion.tonoSiHay : null;
      return { clave: definicion.clave, etiqueta: definicion.etiqueta, valor, estado: 'listo', tono };
    }),
  );

  /** Solicitudes de habilitación PENDIENTES, sin revisor, de provincias sin inspector activo. */
  readonly empresasSinInspector = rxResource<ListaPendientes<EmpresaResponseDto>, undefined>({
    stream: () =>
      this.empresas
        .listarEmpresasSinInspector({ size: TAMANO_LISTA_PENDIENTES })
        .pipe(map((pagina) => ({ elementos: pagina.content, total: pagina.page.totalElements }))),
  });

  /** Circuitos en PENDIENTE_INSPECTOR sin revisor cuya farmacia es de una provincia sin inspector activo. */
  readonly circuitosSinInspector = rxResource<ListaPendientes<CircuitoPendiente>, undefined>({
    stream: () =>
      this.circuitos.listarCircuitosSinInspector({ size: TAMANO_LISTA_PENDIENTES }).pipe(
        switchMap((pagina) => {
          // forkJoin([]) completa sin emitir y un recurso necesita un valor: se cubre el caso vacío.
          if (pagina.content.length === 0) {
            return of({ elementos: [] as CircuitoPendiente[], total: pagina.page.totalElements });
          }
          return forkJoin(pagina.content.map((circuito) => this.completarCircuito(circuito))).pipe(
            map((elementos) => ({ elementos, total: pagina.page.totalElements })),
          );
        }),
      ),
  });

  /** Inspectores ya buscados; se descarta al recargar o si la búsqueda falla. */
  private inspectoresEnCurso: Promise<Resultado<readonly OpcionInspector[]>> | null = null;

  /** Vuelve a pedir todo: mosaicos y listas (por ejemplo, después de asignar). */
  recargar(): void {
    this.inspectoresEnCurso = null;
    for (const { recurso } of this.contadores) {
      recurso.reload();
    }
    this.empresasSinInspector.reload();
    this.circuitosSinInspector.reload();
  }

  /**
   * Inspectores ACTIVO para elegir (hasta 100, el máximo por página). A los primeros
   * {@link MAXIMO_NOMBRES_INSPECTORES} se les busca el nombre; el resto va por legajo.
   * TODO B12: que el inspector traiga su nombre (docs/pedidos-b12.md, punto 6).
   */
  cargarInspectores(): Promise<Resultado<readonly OpcionInspector[]>> {
    if (this.inspectoresEnCurso === null) {
      const pedido = aResultado(
        this.inspectores.listarInspectores({ estado: 'ACTIVO', size: TAMANO_PAGINA_MAXIMO }).pipe(
          switchMap((pagina) => {
            if (pagina.content.length === 0) {
              return of([] as OpcionInspector[]);
            }
            return forkJoin(
              pagina.content.map((inspector, indice) =>
                (indice < MAXIMO_NOMBRES_INSPECTORES ? this.nombres.nombreUsuario(inspector.usuarioId) : of(null)).pipe(
                  map(
                    (nombre): OpcionInspector => ({
                      id: inspector.id,
                      legajo: inspector.legajo,
                      provincia: inspector.provincia,
                      nombre,
                    }),
                  ),
                ),
              ),
            );
          }),
        ),
      );
      this.inspectoresEnCurso = pedido;
      // Un fallo no se guarda: el próximo intento vuelve a pedir.
      void pedido.then((resultado) => {
        if (!resultado.ok && this.inspectoresEnCurso === pedido) {
          this.inspectoresEnCurso = null;
        }
      });
    }
    return this.inspectoresEnCurso;
  }

  /** Asigna una solicitud de habilitación al inspector. La API decide si corresponde (404, 409…). */
  asignarEmpresa(empresaId: string, inspectorId: string): Promise<Resultado<EmpresaResponseDto>> {
    return aResultado(this.empresas.asignarEmpresa({ id: empresaId, body: { inspectorId } }));
  }

  /** Asigna un circuito al inspector. La API decide si corresponde (404, 409…). */
  asignarCircuito(circuitoId: string, inspectorId: string): Promise<Resultado<EnlaceCuitResponseDto>> {
    return aResultado(this.circuitos.asignarCircuito({ id: circuitoId, body: { inspectorId } }));
  }

  /**
   * Mensaje de un recurso en error: el de la API (ErrorApi del interceptor, también si viene
   * envuelto como `cause`) o, si no se puede interpretar, uno genérico.
   */
  mensajeDeError(error: unknown): string {
    if (error instanceof ErrorApi) {
      return error.mensaje;
    }
    if (error instanceof HttpErrorResponse) {
      return parsearErrorApi(error).mensaje;
    }
    if (error instanceof Error && error.cause !== undefined && error.cause !== error) {
      return this.mensajeDeError(error.cause);
    }
    return 'No se pudo cargar. Probá de nuevo.';
  }

  /** Busca los nombres de las tres empresas de un circuito (con caché). */
  private completarCircuito(circuito: EnlaceCuitResponseDto): Observable<CircuitoPendiente> {
    return forkJoin({
      laboratorio: this.nombres.empresa(circuito.laboratorioId),
      distribuidor: this.nombres.empresa(circuito.distribuidorId),
      farmacia: this.nombres.empresa(circuito.farmaciaId),
    }).pipe(
      map(
        ({ laboratorio, distribuidor, farmacia }): CircuitoPendiente => ({
          circuito,
          laboratorio: laboratorio?.razonSocial ?? EMPRESA_SIN_NOMBRE,
          distribuidor: distribuidor?.razonSocial ?? EMPRESA_SIN_NOMBRE,
          farmacia: farmacia?.razonSocial ?? EMPRESA_SIN_NOMBRE,
          provinciaFarmacia: farmacia?.provincia ?? null,
        }),
      ),
    );
  }
}
