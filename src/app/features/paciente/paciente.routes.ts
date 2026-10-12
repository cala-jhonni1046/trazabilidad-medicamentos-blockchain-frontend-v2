import { Routes } from '@angular/router';

/**
 * Rutas del rol Paciente. Se cargan diferidas y solo para ese rol (rolGuard en app.routes.ts).
 * Por ahora, solo el inicio provisorio.
 */
export const rutasPaciente: Routes = [
  {
    path: '',
    title: 'Inicio · MediChain',
    loadComponent: () =>
      import('../comun/inicio-provisorio/inicio-provisorio').then((modulo) => modulo.InicioProvisorio),
  },
];
