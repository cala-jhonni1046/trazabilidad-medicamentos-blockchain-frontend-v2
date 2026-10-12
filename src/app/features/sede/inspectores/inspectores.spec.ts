import { boton, botones, crearPantalla, enviarDialogo, errorApi, limpiarOverlays, pagina } from '../../../../testing/entorno';
import { Inspectores } from './inspectores';

const inspector = (cambios: object = {}) => ({
  id: 'i1', usuarioId: 'u1', legajo: 'L-001', dni: '20111222', provincia: 'MENDOZA', estado: 'ACTIVO', fechaAlta: '2026-10-01T12:00:00Z', ...cambios,
});

async function cargar(filas: object[]) {
  const p = crearPantalla(Inspectores, 'SEDE_CENTRAL');
  p.responder('/api/inspectores-anmat', pagina(filas));
  await vi.waitFor(() => p.http.match((r) => r.url === '/api/usuarios/u1').forEach((r) => r.flush({ nombre: 'Laura', apellido: 'Gómez' })));
  await p.esperar(() => expect(p.raiz.querySelector('tbody tr')).not.toBeNull());
  return p;
}

describe('Inspectores', () => {
  afterEach(limpiarOverlays);

  it('lista con nombre, legajo y provincia; Dar de baja para activos, Reactivar para los de baja', async () => {
    const p = await cargar([inspector(), inspector({ id: 'i2', usuarioId: 'u1', legajo: 'L-002', estado: 'BAJA' })]);

    expect(p.raiz.querySelector('tbody tr')?.textContent).toContain('Laura Gómez');
    expect(p.raiz.querySelector('tbody tr')?.textContent).toContain('Mendoza');
    expect(Array.from(p.raiz.querySelectorAll('tbody tr')).map((f) => botones(f))).toEqual([['Dar de baja'], ['Reactivar']]);
  });

  it('si no se puede leer el nombre, lo dice y no falla', async () => {
    const p = crearPantalla(Inspectores, 'SEDE_CENTRAL');
    p.responder('/api/inspectores-anmat', pagina([inspector()]));
    await vi.waitFor(() => p.http.expectOne('/api/usuarios/u1').flush(...errorApi(404, 'No encontrado')));
    await p.esperar(() => expect(p.raiz.querySelector('tbody tr')).not.toBeNull());

    expect(p.raiz.querySelector('tbody tr')?.textContent).toContain('Sin nombre disponible');
  });

  it('dar de baja confirma y llama a la API; un 409 se ve en el diálogo', async () => {
    const p = await cargar([inspector()]);

    boton(p.raiz, 'Dar de baja').click();
    await enviarDialogo();
    p.http.expectOne('/api/inspectores-anmat/i1/baja').flush(...errorApi(409, 'El inspector ya está de baja', 'TRANSICION_INVALIDA'));

    await vi.waitFor(() => expect(document.querySelector('mc-dialogo-accion [role="alert"]')?.textContent).toContain('ya está de baja'));
  });

  it('"Dar de alta" abre el formulario de alta', async () => {
    const p = await cargar([inspector()]);

    boton(p.raiz, 'Dar de alta').click();

    await vi.waitFor(() => expect(document.querySelector('mc-dialogo-nuevo-inspector')).not.toBeNull());
  });
});
