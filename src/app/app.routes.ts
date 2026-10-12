import { Routes } from '@angular/router';
import { rutasDesarrollo } from './dev/dev.routes';

/** Rutas de la aplicación. */
export const routes: Routes = [
  // Solo en desarrollo (/dev); en producción es una lista vacía (ver dev.routes.ts).
  ...rutasDesarrollo,
];
