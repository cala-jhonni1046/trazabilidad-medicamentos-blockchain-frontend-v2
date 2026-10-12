import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/** Cuánto queda visible un aviso de error, en milisegundos. */
const DURACION_ERROR_MS = 8000;

/** Cuánto queda visible un aviso de éxito, en milisegundos. */
const DURACION_EXITO_MS = 5000;

/**
 * Avisos globales (snackbar de Material) para lo que no pertenece a una pantalla:
 * sin conexión, falta de permiso, error del servidor.
 * Los errores de una acción (400, 404, 409, 503) se muestran en la pantalla, no acá.
 */
@Injectable({ providedIn: 'root' })
export class AvisosService {
  private readonly snackBar = inject(MatSnackBar);

  /** Muestra un error global; los lectores de pantalla lo anuncian con prioridad. */
  mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', { duration: DURACION_ERROR_MS, politeness: 'assertive' });
  }

  /** Confirma una acción lograda; los lectores de pantalla lo anuncian sin interrumpir. */
  mostrarExito(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', { duration: DURACION_EXITO_MS, politeness: 'polite' });
  }
}
