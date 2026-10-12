import { Routes } from '@angular/router';
import { invitadoGuard, redirigirAlInicio, rolGuard } from './core/auth/guards';
import { rutasDesarrollo } from './dev/dev.routes';

/**
 * Rutas de la aplicación.
 *
 * Cada rol tiene su rama, cargada diferida y protegida con rolGuard (canMatch): el código
 * de un rol no se descarga para otro. Los inicios de cada rol están en rutas-sesion.ts.
 */
export const routes: Routes = [
  // "/": al inicio del rol, o a ingresar si no hay sesión.
  { path: '', pathMatch: 'full', redirectTo: redirigirAlInicio },
  {
    path: 'ingresar',
    title: 'Ingresar · MediChain',
    canMatch: [invitadoGuard],
    loadComponent: () => import('./features/publico/ingresar/ingresar').then((modulo) => modulo.Ingresar),
  },
  {
    path: 'sede',
    canMatch: [rolGuard(['SEDE_CENTRAL'])],
    loadChildren: () => import('./features/sede/sede.routes').then((modulo) => modulo.rutasSede),
  },
  {
    path: 'inspector',
    canMatch: [rolGuard(['INSPECTOR'])],
    loadChildren: () => import('./features/inspector/inspector.routes').then((modulo) => modulo.rutasInspector),
  },
  {
    path: 'laboratorio',
    canMatch: [rolGuard(['LABORATORIO'])],
    loadChildren: () => import('./features/laboratorio/laboratorio.routes').then((modulo) => modulo.rutasLaboratorio),
  },
  {
    path: 'distribuidora',
    canMatch: [rolGuard(['DISTRIBUIDOR'])],
    loadChildren: () =>
      import('./features/distribuidor/distribuidor.routes').then((modulo) => modulo.rutasDistribuidor),
  },
  {
    path: 'farmacia',
    canMatch: [rolGuard(['FARMACIA'])],
    loadChildren: () => import('./features/farmacia/farmacia.routes').then((modulo) => modulo.rutasFarmacia),
  },
  {
    path: 'paciente',
    canMatch: [rolGuard(['PACIENTE'])],
    loadChildren: () => import('./features/paciente/paciente.routes').then((modulo) => modulo.rutasPaciente),
  },
  // Solo en desarrollo (/dev); en producción es una lista vacía (ver dev.routes.ts).
  ...rutasDesarrollo,
  {
    path: '**',
    title: 'Página no encontrada · MediChain',
    loadComponent: () =>
      import('./features/comun/no-encontrada/no-encontrada').then((modulo) => modulo.NoEncontrada),
  },
];
