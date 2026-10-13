import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, Signal, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { CircuitosService } from '../../../core/api/generado/services/circuitos.service';
import { EmpresasService } from '../../../core/api/generado/services/empresas.service';
import { InspectoresAnmatService } from '../../../core/api/generado/services/inspectores-anmat.service';
import { TableroService } from '../../../core/api/generado/services/tablero.service';
import { EmpresaResponseDto, EnlaceCuitResponseDto, Provincia, TableroResumenResponseDto } from '../../../core/api/modelos';
import { TAMANO_PAGINA_MAXIMO } from '../../../core/api/pagina';
import { Resultado, aResultado } from '../../../core/api/resultado';
import { ErrorApi, parsearErrorApi } from '../../../core/errores/error-api';
import { Tono } from '../../../shared/estados/catalogo-estados';
import { EstadoCarga } from '../../../shared/ui/mosaico';

/** Cuántos pendientes se piden por lista (primera página). */
export const TAMANO_LISTA_PENDIENTES = 20;

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

/** Un inspector activo que se puede elegir para asignar. */
export interface OpcionInspector {
  /** Id del inspector (lo que espera la API en `inspectorId`). */
  readonly id: string;
  readonly legajo: string;
  readonly provincia: Provincia;
  /** "Nombre Apellido" (vienen en el inspector). */
  readonly nombre: string;
}

/** Definición de un mosaico: qué cuenta del resumen muestra y cuándo resaltarlo. */
interface DefinicionMosaico {
  readonly clave: keyof TableroResumenResponseDto;
  readonly etiqueta: string;
  /** Si hay algo (valor > 0) se resalta con este tono. */
  readonly tonoSiHay?: Tono;
}

/** Los 7 mosaicos, en orden: cada uno lee su total del resumen que devuelve la API. */
const MOSAICOS: readonly DefinicionMosaico[] = [
  { clave: 'empresas', etiqueta: 'Empresas' },
  { clave: 'empresasPendientes', etiqueta: 'Empresas pendientes', tonoSiHay: 'atencion' },
  { clave: 'inspectoresActivos', etiqueta: 'Inspectores activos' },
  { clave: 'circuitosAprobados', etiqueta: 'Circuitos aprobados' },
  { clave: 'cuarentenasActivas', etiqueta: 'Cuarentenas activas', tonoSiHay: 'atencion' },
  { clave: 'eventos', etiqueta: 'Eventos en la cadena' },
  { clave: 'anclajesConfirmados', etiqueta: 'Anclajes confirmados en Sepolia' },
];

/**
 * Datos del tablero de la Sede: el resumen en mosaicos, las listas de pendientes de asignar
 * y la asignación a un inspector. Lo provee la página (no es global).
 *
 * El resumen sale de UN pedido (`GET /api/tablero/resumen`); las dos listas de pendientes son recursos
 * aparte: si una falla, las otras siguen.
 * Las decisiones (si se puede asignar o no, R2) las toma la API: acá solo se muestran sus errores.
 */
@Injectable()
export class TableroDatos {
  private readonly empresas = inject(EmpresasService);
  private readonly circuitos = inject(CircuitosService);
  private readonly inspectores = inject(InspectoresAnmatService);
  private readonly tablero = inject(TableroService);

  /** Los totales de la Sede, en un solo pedido. */
  private readonly resumen = rxResource<TableroResumenResponseDto, undefined>({
    stream: () => this.tablero.obtenerResumenTablero(),
  });

  /** Los mosaicos del resumen; si el pedido falla, todos se marcan "error" (el resto de la pantalla sigue). */
  readonly mosaicos: Signal<readonly MosaicoVista[]> = computed(() =>
    MOSAICOS.map((definicion): MosaicoVista => {
      const { clave, etiqueta } = definicion;
      // value() lanza si el recurso está en error: se mira el estado antes.
      if (this.resumen.status() === 'error') {
        return { clave, etiqueta, valor: null, estado: 'error', tono: null };
      }
      if (!this.resumen.hasValue()) {
        return { clave, etiqueta, valor: null, estado: 'cargando', tono: null };
      }
      const valor = this.resumen.value()[clave];
      const tono = definicion.tonoSiHay !== undefined && valor > 0 ? definicion.tonoSiHay : null;
      return { clave, etiqueta, valor, estado: 'listo', tono };
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
  readonly circuitosSinInspector = rxResource<ListaPendientes<EnlaceCuitResponseDto>, undefined>({
    stream: () =>
      this.circuitos
        .listarCircuitosSinInspector({ size: TAMANO_LISTA_PENDIENTES })
        .pipe(map((pagina) => ({ elementos: pagina.content, total: pagina.page.totalElements }))),
  });

  /** Inspectores ya buscados; se descarta al recargar o si la búsqueda falla. */
  private inspectoresEnCurso: Promise<Resultado<readonly OpcionInspector[]>> | null = null;

  /** Vuelve a pedir todo: mosaicos y listas (por ejemplo, después de asignar). */
  recargar(): void {
    this.inspectoresEnCurso = null;
    this.resumen.reload();
    this.empresasSinInspector.reload();
    this.circuitosSinInspector.reload();
  }

  /** Inspectores ACTIVO para elegir (hasta 100, el máximo por página), con su nombre y apellido. */
  cargarInspectores(): Promise<Resultado<readonly OpcionInspector[]>> {
    if (this.inspectoresEnCurso === null) {
      const pedido = aResultado(
        this.inspectores.listarInspectores({ estado: 'ACTIVO', size: TAMANO_PAGINA_MAXIMO }).pipe(
          map((pagina) =>
            pagina.content.map(
              (inspector): OpcionInspector => ({
                id: inspector.id,
                legajo: inspector.legajo,
                provincia: inspector.provincia,
                nombre: `${inspector.nombre} ${inspector.apellido}`,
              }),
            ),
          ),
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
}
