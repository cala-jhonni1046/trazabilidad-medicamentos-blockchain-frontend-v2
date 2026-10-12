import { PAGINA_VACIA, boton, crearPantalla, pagina } from '../../../../testing/entorno';
import { Equipo } from './equipo';

describe('Equipo', () => {
  it('el administrador ve "Agregar un empleado"; un empleado común, no', async () => {
    const admin = crearPantalla(Equipo, 'LABORATORIO', { sesion: { esAdminEmpresa: true } });
    admin.responder('/api/usuarios', pagina([{ id: 'u1', nombre: 'Elena', apellido: 'Paz', email: 'e@lab.demo', rol: 'LABORATORIO', activo: true, esAdminEmpresa: true, esDirectorTecnico: true }]));
    await admin.esperar(() => expect(admin.raiz.querySelector('tbody tr')).not.toBeNull());
    expect(boton(admin.raiz, 'Agregar un empleado')).toBeTruthy();
    expect(admin.raiz.textContent).toContain('Administrador · Director técnico');
  });

  it('un empleado sin permisos de administración no ve el botón de alta', async () => {
    const p = crearPantalla(Equipo, 'FARMACIA', { sesion: { esAdminEmpresa: false } });
    p.responder('/api/usuarios', PAGINA_VACIA);

    await p.esperar(() => expect(p.raiz.textContent).toContain('Todavía no hay usuarios.'));
    expect(() => boton(p.raiz, 'Agregar un empleado')).toThrow();
  });
});
