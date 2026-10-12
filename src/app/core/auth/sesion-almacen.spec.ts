import { sesionDePrueba } from '../../../testing/sesion-de-prueba';
import { CLAVE_SESION, borrarSesionGuardada, guardarSesion, leerSesionGuardada } from './sesion-almacen';

/** Storage que falla en todo, como un navegador con el almacenamiento bloqueado. */
const almacenBloqueado: Storage = {
  length: 0,
  clear: () => {
    throw new DOMException('bloqueado', 'SecurityError');
  },
  getItem: () => {
    throw new DOMException('bloqueado', 'SecurityError');
  },
  key: () => null,
  removeItem: () => {
    throw new DOMException('bloqueado', 'SecurityError');
  },
  setItem: () => {
    throw new DOMException('bloqueado', 'SecurityError');
  },
};

describe('almacén de la sesión', () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  it('guarda la sesión y la vuelve a leer igual', () => {
    const sesion = sesionDePrueba({ rol: 'INSPECTOR', provincia: 'MENDOZA' });

    guardarSesion(sessionStorage, sesion);

    expect(leerSesionGuardada(sessionStorage)).toEqual(sesion);
  });

  it('sin nada guardado devuelve null', () => {
    expect(leerSesionGuardada(sessionStorage)).toBeNull();
  });

  it('un texto que no es JSON devuelve null', () => {
    sessionStorage.setItem(CLAVE_SESION, '{no es json');

    expect(leerSesionGuardada(sessionStorage)).toBeNull();
  });

  it.each([
    ['token vacío', { token: '' }],
    ['rol desconocido', { rol: 'ADMIN' }],
    ['expiraEn que no es fecha', { expiraEn: 'mañana' }],
    ['provincia inválida', { provincia: 'ATLANTIDA' }],
    ['empresaId numérico', { empresaId: 7 }],
    ['marca que no es booleana', { esAdminEmpresa: 'sí' }],
  ])('descarta una sesión guardada con %s', (_descripcion, cambios) => {
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify({ ...sesionDePrueba(), ...cambios }));

    expect(leerSesionGuardada(sessionStorage)).toBeNull();
  });

  it('descarta una sesión guardada a la que le falta un campo', () => {
    const incompleta: Record<string, unknown> = { ...sesionDePrueba() };
    delete incompleta['esDirectorTecnico'];
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(incompleta));

    expect(leerSesionGuardada(sessionStorage)).toBeNull();
  });

  it('borrar elimina lo guardado', () => {
    guardarSesion(sessionStorage, sesionDePrueba());

    borrarSesionGuardada(sessionStorage);

    expect(sessionStorage.getItem(CLAVE_SESION)).toBeNull();
  });

  it('con el almacenamiento bloqueado (o sin almacenamiento) no lanza', () => {
    expect(leerSesionGuardada(almacenBloqueado)).toBeNull();
    expect(() => guardarSesion(almacenBloqueado, sesionDePrueba())).not.toThrow();
    expect(() => borrarSesionGuardada(almacenBloqueado)).not.toThrow();
    expect(leerSesionGuardada(null)).toBeNull();
    expect(() => guardarSesion(null, sesionDePrueba())).not.toThrow();
  });
});
