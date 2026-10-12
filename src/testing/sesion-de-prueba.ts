import { CLAVE_SESION } from '../app/core/auth/sesion-almacen';
import { Sesion } from '../app/core/auth/sesion.model';

// Ayudas para los tests (no se importan desde la aplicación: no llegan al bundle).

/** Una hora después de ahora, en ISO-8601 UTC (respeta el reloj simulado de los tests). */
export function enUnaHora(): string {
  return new Date(Date.now() + 60 * 60 * 1000).toISOString();
}

/** Sesión válida con datos ficticios; se puede cambiar cualquier campo. */
export function sesionDePrueba(cambios: Partial<Sesion> = {}): Sesion {
  return {
    token: 'token-de-prueba',
    expiraEn: enUnaHora(),
    usuarioId: '00000000-0000-4000-8000-000000000001',
    nombre: 'Ana Prueba',
    rol: 'SEDE_CENTRAL',
    empresaId: null,
    esAdminEmpresa: false,
    esDirectorTecnico: false,
    provincia: null,
    ...cambios,
  };
}

/** Deja una sesión en sessionStorage, como si la persona hubiera ingresado antes de recargar. */
export function guardarSesionDePrueba(sesion: Sesion): void {
  sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
}
