import { Signal, computed, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { Pagina } from '../api/pagina';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorApi, parsearErrorApi } from '../errores/error-api';

/** Opciones de tamaño de página que se ofrecen (el backend acepta hasta 100). */
export const TAMANOS_PAGINA = [10, 20, 50] as const;

/** Parámetros con los que se pide una página. */
export interface ParametrosLista<F> {
  readonly pagina: number;
  readonly tamano: number;
  readonly filtro: F;
}

/**
 * Lista paginada con filtro: pide una página al backend cada vez que cambia la página, el
 * tamaño o el filtro, y expone los elementos, el total y el estado de carga como signals.
 *
 * Se crea dentro de un contexto de inyección (en el constructor o en un campo de un servicio de
 * datos), porque usa `rxResource`. Un error se conserva en `error` y no tumba otras listas.
 */
export class ListaPaginada<T, F = null> {
  readonly paginaActual = signal(0);
  readonly tamano = signal<number>(TAMANOS_PAGINA[0]);
  readonly filtro: ReturnType<typeof signal<F>>;

  private readonly recurso;

  constructor(
    filtroInicial: F,
    cargar: (parametros: ParametrosLista<F>) => Observable<Pagina<T>>,
  ) {
    this.filtro = signal<F>(filtroInicial);
    this.recurso = rxResource<Pagina<T>, ParametrosLista<F>>({
      params: () => ({ pagina: this.paginaActual(), tamano: this.tamano(), filtro: this.filtro() }),
      stream: ({ params }) => cargar(params),
    });
  }

  /** Elementos de la página actual (vacío mientras carga la primera vez o si falló). */
  readonly elementos: Signal<readonly T[]> = computed(() => (this.recurso.hasValue() ? this.recurso.value().content : []));

  /** Total de elementos en el backend (con el filtro aplicado). */
  readonly total: Signal<number> = computed(() => (this.recurso.hasValue() ? this.recurso.value().page.totalElements : 0));

  /** True mientras carga (la primera vez o al cambiar de página). */
  readonly cargando: Signal<boolean> = computed(() => this.recurso.isLoading());

  /** El error de la última carga, o null. */
  readonly error: Signal<ErrorApi | null> = computed(() => {
    if (this.recurso.status() !== 'error') {
      return null;
    }
    return aErrorApi(this.recurso.error());
  });

  /** True si cargó y no hay elementos (para mostrar el estado vacío). */
  readonly vacia: Signal<boolean> = computed(() => this.recurso.hasValue() && this.total() === 0);

  /** Cambia de página o de tamaño (evento del paginador de Material). */
  irA(pagina: number, tamano: number): void {
    this.tamano.set(tamano);
    this.paginaActual.set(pagina);
  }

  /** Cambia el filtro y vuelve a la primera página. */
  filtrarPor(filtro: F): void {
    this.filtro.set(filtro);
    this.paginaActual.set(0);
  }

  /** Vuelve a pedir la página actual (por ejemplo, después de una acción). */
  recargar(): void {
    this.recurso.reload();
  }
}

/** Interpreta lo que deja un recurso en error (ErrorApi del interceptor, HttpErrorResponse o su causa). */
function aErrorApi(error: unknown): ErrorApi {
  if (error instanceof ErrorApi) {
    return error;
  }
  if (error instanceof HttpErrorResponse) {
    return parsearErrorApi(error);
  }
  if (error instanceof Error && error.cause !== undefined && error.cause !== error) {
    return aErrorApi(error.cause);
  }
  return new ErrorApi(0, 'No se pudo cargar. Probá de nuevo.', null, []);
}
