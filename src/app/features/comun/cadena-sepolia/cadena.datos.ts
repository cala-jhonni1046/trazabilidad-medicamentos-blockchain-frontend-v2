import { DestroyRef, Injectable, Signal, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Subscription, switchMap, takeWhile, timer } from 'rxjs';
import { EventosDeTrazabilidadService } from '../../../core/api/generado/services/eventos-de-trazabilidad.service';
import { RegistrosBlockchainService } from '../../../core/api/generado/services/registros-blockchain.service';
import {
  EstadoAnclajeResponseDto,
  EventoTrazabilidadResponseDto,
  RegistroBlockchainResponseDto,
  VerificacionCadenaResponseDto,
} from '../../../core/api/modelos';
import { Resultado, aResultado } from '../../../core/api/resultado';
import { ErrorApi } from '../../../core/errores/error-api';
import { ListaPaginada } from '../../../core/listas/lista-paginada';

/** Cada cuánto se consulta un anclaje en curso. */
export const INTERVALO_SEGUIMIENTO_MS = 5000;

/** Cuánto se sigue un anclaje antes de pedir que se actualice a mano (5 minutos). */
export const TOPE_SEGUIMIENTO_MS = 5 * 60 * 1000;

/** Estados en los que un anclaje ya no cambia. */
const ESTADOS_FINALES: readonly string[] = ['CONFIRMADO', 'FALLIDO'];

/** Resultado de verificar la cadena: el informe, o el error de la API. */
export type EstadoVerificacion =
  | { readonly tipo: 'sin-hacer' }
  | { readonly tipo: 'verificando' }
  | { readonly tipo: 'listo'; readonly informe: VerificacionCadenaResponseDto }
  | { readonly tipo: 'error'; readonly error: ErrorApi };

/**
 * Datos de "Cadena y Sepolia": estado del anclaje, verificación de la cadena (a pedido),
 * "Anclar ya" con seguimiento, y los historiales de anclajes y de eventos.
 * Cada bloque es independiente: si uno falla, los demás siguen. Lo provee la página.
 */
@Injectable()
export class CadenaDatos {
  private readonly anclajes = inject(RegistrosBlockchainService);
  private readonly eventos = inject(EventosDeTrazabilidadService);
  private readonly destruccion = inject(DestroyRef);

  /** Estado actual del anclaje (consulta la red: puede tardar). */
  readonly estado = rxResource<EstadoAnclajeResponseDto, undefined>({
    stream: () => this.anclajes.obtenerEstadoAnclaje(),
  });

  /** Historial de anclajes, los más nuevos primero (así los devuelve la API). */
  readonly historialAnclajes = new ListaPaginada<RegistroBlockchainResponseDto>(null, ({ pagina, tamano }) =>
    this.anclajes.listarAnclajes({ page: pagina, size: tamano }),
  );

  /** Eventos de la cadena, del más reciente al más antiguo. */
  readonly historialEventos = new ListaPaginada<EventoTrazabilidadResponseDto>(null, ({ pagina, tamano }) =>
    this.eventos.listarEventos({ page: pagina, size: tamano }),
  );

  private readonly estadoVerificacion = signal<EstadoVerificacion>({ tipo: 'sin-hacer' });
  /** Resultado de la última verificación de la cadena. */
  readonly verificacion: Signal<EstadoVerificacion> = this.estadoVerificacion.asReadonly();

  private readonly anclajeSeguido = signal<RegistroBlockchainResponseDto | null>(null);
  /** El anclaje que se acaba de pedir y se está siguiendo (o terminó), con su último estado conocido. */
  readonly anclajeEnSeguimiento: Signal<RegistroBlockchainResponseDto | null> = this.anclajeSeguido.asReadonly();

  private readonly seguimientoAgotado = signal(false);
  /** True si se agotó el tiempo de seguimiento sin que el anclaje terminara. */
  readonly seguimientoVencido: Signal<boolean> = this.seguimientoAgotado.asReadonly();

  private readonly errorDeSeguimiento = signal<ErrorApi | null>(null);
  /** Error al consultar el anclaje en seguimiento. */
  readonly errorSeguimiento: Signal<ErrorApi | null> = this.errorDeSeguimiento.asReadonly();

  private suscripcion: Subscription | null = null;

  constructor() {
    // Al salir de la pantalla se deja de consultar.
    this.destruccion.onDestroy(() => this.suscripcion?.unsubscribe());
  }

  /** Vuelve a pedir el estado y los dos historiales. */
  recargar(): void {
    this.estado.reload();
    this.historialAnclajes.recargar();
    this.historialEventos.recargar();
  }

  /**
   * Recorre toda la cadena local y la compara con la blockchain (puede tardar).
   * El informe se muestra como lo devuelve la API; ALTERADA o no íntegra no es un error de HTTP.
   */
  async verificarCadena(): Promise<void> {
    this.estadoVerificacion.set({ tipo: 'verificando' });
    const resultado = await aResultado(this.eventos.verificarCadena());
    this.estadoVerificacion.set(resultado.ok ? { tipo: 'listo', informe: resultado.valor } : { tipo: 'error', error: resultado.error });
  }

  /**
   * Pide anclar ya (202). Si la API lo acepta, empieza a seguir el anclaje hasta que termine.
   * Los 409 (ANCLAJE_EN_CURSO, SIN_EVENTOS_NUEVOS, SALDO_INSUFICIENTE, R15…) y el 503 vuelven
   * como error de la API para mostrarlos junto al botón.
   */
  async anclarAhora(): Promise<Resultado<RegistroBlockchainResponseDto>> {
    const resultado = await aResultado(this.anclajes.anclarAhora());
    if (resultado.ok) {
      this.seguir(resultado.valor);
    }
    return resultado;
  }

  /** Sigue un anclaje con `obtenerAnclaje` cada {@link INTERVALO_SEGUIMIENTO_MS} hasta que termine o se agote el tiempo. */
  private seguir(inicial: RegistroBlockchainResponseDto): void {
    this.suscripcion?.unsubscribe();
    this.anclajeSeguido.set(inicial);
    this.seguimientoAgotado.set(false);
    this.errorDeSeguimiento.set(null);
    if (ESTADOS_FINALES.includes(inicial.estado)) {
      this.recargar();
      return;
    }
    const intentos = Math.floor(TOPE_SEGUIMIENTO_MS / INTERVALO_SEGUIMIENTO_MS);
    let consultas = 0;
    this.suscripcion = timer(INTERVALO_SEGUIMIENTO_MS, INTERVALO_SEGUIMIENTO_MS)
      .pipe(
        switchMap(() => this.anclajes.obtenerAnclaje({ id: inicial.id })),
        takeWhile((anclaje) => {
          consultas += 1;
          this.anclajeSeguido.set(anclaje);
          const sigue = !ESTADOS_FINALES.includes(anclaje.estado);
          if (sigue && consultas >= intentos) {
            this.seguimientoAgotado.set(true);
            return false;
          }
          return sigue;
        }, true),
      )
      .subscribe({
        error: (error: unknown) => this.errorDeSeguimiento.set(error instanceof ErrorApi ? error : new ErrorApi(0, 'No se pudo consultar el anclaje.', null, [])),
        complete: () => this.recargar(),
      });
  }
}
