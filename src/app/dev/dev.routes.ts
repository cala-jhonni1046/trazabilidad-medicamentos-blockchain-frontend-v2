import { Routes } from '@angular/router';

/**
 * Rutas solo de desarrollo: el muestrario de diseño en /dev.
 *
 * En el build de producción, angular.json reemplaza este archivo por
 * dev.routes.produccion.ts (lista vacía): el muestrario no llega al bundle.
 */
export const rutasDesarrollo: Routes = [
  {
    path: 'dev',
    title: 'Muestrario · MediChain',
    loadComponent: () => import('./muestrario/muestrario').then((modulo) => modulo.Muestrario),
  },
];
