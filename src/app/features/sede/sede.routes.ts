import { Routes } from '@angular/router';

/**
 * Rutas del rol Sede Central. Se cargan diferidas y solo para ese rol (rolGuard en app.routes.ts).
 * Por ahora, solo el tablero.
 */
export const rutasSede: Routes = [
  {
    path: '',
    title: 'Tablero · MediChain',
    loadComponent: () => import('./tablero/tablero').then((modulo) => modulo.Tablero),
  },
];
