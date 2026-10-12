import { Routes } from '@angular/router';
import { invitadoGuard, redirigirAlInicio, rolGuard } from './core/auth/guards';
import { rutasDesarrollo } from './dev/dev.routes';

/** Marco de las pantallas con sesión (menú lateral por rol); lo comparten las seis ramas de rol. */
const cargarShellApp = () => import('./core/layout/shell-app').then((modulo) => modulo.ShellApp);

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
    // Pantallas públicas dentro del marco público (por ahora, solo ingresar).
    path: 'ingresar',
    canMatch: [invitadoGuard],
    loadComponent: () => import('./core/layout/shell-publico').then((modulo) => modulo.ShellPublico),
    children: [
      {
        path: '',
        title: 'Ingresar · MediChain',
        loadComponent: () => import('./features/publico/ingresar/ingresar').then((modulo) => modulo.Ingresar),
      },
    ],
  },
  {
    path: 'sede',
    loadComponent: cargarShellApp,
    canMatch: [rolGuard(['SEDE_CENTRAL'])],
    loadChildren: () => import('./features/sede/sede.routes').then((modulo) => modulo.rutasSede),
  },
  {
    path: 'inspector',
    loadComponent: cargarShellApp,
    canMatch: [rolGuard(['INSPECTOR'])],
    loadChildren: () => import('./features/inspector/inspector.routes').then((modulo) => modulo.rutasInspector),
  },
  {
    path: 'laboratorio',
    loadComponent: cargarShellApp,
    canMatch: [rolGuard(['LABORATORIO'])],
    loadChildren: () => import('./features/laboratorio/laboratorio.routes').then((modulo) => modulo.rutasLaboratorio),
  },
  {
    path: 'distribuidora',
    loadComponent: cargarShellApp,
    canMatch: [rolGuard(['DISTRIBUIDOR'])],
    loadChildren: () =>
      import('./features/distribuidor/distribuidor.routes').then((modulo) => modulo.rutasDistribuidor),
  },
  {
    path: 'farmacia',
    loadComponent: cargarShellApp,
    canMatch: [rolGuard(['FARMACIA'])],
    loadChildren: () => import('./features/farmacia/farmacia.routes').then((modulo) => modulo.rutasFarmacia),
  },
  {
    path: 'paciente',
    loadComponent: cargarShellApp,
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
