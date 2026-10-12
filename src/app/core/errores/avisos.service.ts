import { Injectable, Injector, inject } from '@angular/core';

/** Cuánto queda visible un aviso de error, en milisegundos. */
const DURACION_ERROR_MS = 8000;

/** Cuánto queda visible un aviso de éxito, en milisegundos. */
const DURACION_EXITO_MS = 5000;

/**
 * Avisos globales (snackbar de Material) para lo que no pertenece a una pantalla:
 * sin conexión, falta de permiso, error del servidor, confirmación de una acción.
 * Los errores de una acción (400, 404, 409, 503) se muestran en la pantalla, no acá.
 *
 * El snackbar (y el overlay de CDK que usa) se carga recién al mostrar el primer aviso: así no
 * pesa en el bundle inicial, que se descarga antes del login.
 */
@Injectable({ providedIn: 'root' })
export class AvisosService {
  private readonly inyector = inject(Injector);

  /** Muestra un error global; los lectores de pantalla lo anuncian con prioridad. */
  mostrarError(mensaje: string): Promise<void> {
    return this.mostrar(mensaje, DURACION_ERROR_MS, 'assertive');
  }

  /** Confirma una acción lograda; los lectores de pantalla lo anuncian sin interrumpir. */
  mostrarExito(mensaje: string): Promise<void> {
    return this.mostrar(mensaje, DURACION_EXITO_MS, 'polite');
  }

  private async mostrar(mensaje: string, duracion: number, politeness: 'assertive' | 'polite'): Promise<void> {
    const { MatSnackBar } = await import('@angular/material/snack-bar');
    try {
      this.inyector.get(MatSnackBar).open(mensaje, 'Cerrar', { duration: duracion, politeness });
    } catch {
      // La aplicación ya se cerró (por ejemplo, al terminar un test): no hay dónde mostrar el aviso.
    }
  }
}
