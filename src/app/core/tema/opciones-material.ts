import { Provider } from '@angular/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldDefaultOptions } from '@angular/material/form-field';

/**
 * Opciones de los campos de formulario de Material para toda la aplicación:
 * - apariencia con contorno (como el prototipo), no rellena;
 * - el espacio del mensaje de ayuda o error aparece solo cuando hay mensaje.
 */
const OPCIONES_CAMPOS: MatFormFieldDefaultOptions = {
  appearance: 'outline',
  subscriptSizing: 'dynamic',
};

/**
 * Opciones de Angular Material para las pantallas con formularios.
 *
 * NO se registran en app.config.ts: importar el token de form-field ahí metería Material
 * Forms y @angular/forms en el bundle inicial. Cada componente con formularios las suma a
 * sus `providers` (cargan diferidos junto con el componente).
 */
export function proveerOpcionesMaterial(): Provider[] {
  return [{ provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: OPCIONES_CAMPOS }];
}
