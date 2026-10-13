import { TestBed } from '@angular/core/testing';
import { PAGINA_VACIA, boton, botones, crearPantalla, enviarDialogo, errorApi, limpiarOverlays, pagina } from '../../../../testing/entorno';
import { ListaCircuitos } from './lista-circuitos';

const circuito = (cambios: object = {}) => ({
  id: 'c1', codigo: 'CIR-0003', estado: 'PENDIENTE_INSPECTOR', laboratorioId: 'l1', distribuidorId: 'd1', farmaciaId: 'f1',
  laboratorioRazonSocial: 'Lab Andino', distribuidorRazonSocial: 'Distribuidora Pie de Monte', farmaciaRazonSocial: 'Farmacia Cerro Arco',
  fechaPropuesta: '2026-10-08T18:00:00Z', inspectorRevisorId: null, fechaAceptacionDistribuidor: null, fechaAceptacionFarmacia: null, ...cambios,
});

/** Responde el listado (los nombres de las empresas vienen en cada circuito). */
async function cargar(p: ReturnType<typeof crearPantalla<ListaCircuitos>>, url: string, filas: object[]) {
  p.responder(url, pagina(filas));
  await p.esperar(() => expect(p.raiz.querySelector('tbody tr')).not.toBeNull());
}

describe('ListaCircuitos', () => {
  afterEach(limpiarOverlays);

  it('muestra el recorrido con los nombres de las tres empresas', async () => {
    const p = crearPantalla(ListaCircuitos, 'SEDE_CENTRAL');
    await cargar(p, '/api/circuitos', [circuito({ estado: 'APROBADO' })]);

    expect(p.raiz.querySelector('tbody tr')?.textContent).toContain('Lab Andino → Distribuidora Pie de Monte → Farmacia Cerro Arco');
  });

  it('inspector: sin tomar ofrece Tomar; tomado ofrece Aprobar y Rechazar', async () => {
    const p = crearPantalla(ListaCircuitos, 'INSPECTOR', { entradas: { modo: 'bandeja' } });
    await cargar(p, '/api/circuitos/bandeja', [circuito(), circuito({ id: 'c2', inspectorRevisorId: 'i1' })]);

    const filas = Array.from(p.raiz.querySelectorAll('tbody tr')).map((f) => botones(f));
    expect(filas).toEqual([['Tomar'], ['Aprobar', 'Rechazar']]);
  });

  it('la Sede y el inspector suspenden un circuito aprobado y rehabilitan uno suspendido', async () => {
    const p = crearPantalla(ListaCircuitos, 'SEDE_CENTRAL');
    await cargar(p, '/api/circuitos', [circuito({ estado: 'APROBADO' }), circuito({ id: 'c2', estado: 'SUSPENDIDO', motivoSuspension: 'Inspección' })]);

    expect(Array.from(p.raiz.querySelectorAll('tbody tr')).map((f) => botones(f))).toEqual([['Suspender'], ['Rehabilitar']]);
  });

  it('administrador de una farmacia: acepta o rechaza lo pendiente; si ya aceptó, solo rechaza', async () => {
    const p = crearPantalla(ListaCircuitos, 'FARMACIA', { sesion: { esAdminEmpresa: true }, entradas: { modo: 'por-aceptar' } });
    await cargar(p, '/api/circuitos/pendientes-aceptacion', [
      circuito({ estado: 'PENDIENTE_EMPRESAS' }),
      circuito({ id: 'c2', estado: 'PENDIENTE_EMPRESAS', fechaAceptacionFarmacia: '2026-10-09T10:00:00Z' }),
    ]);

    const filas = Array.from(p.raiz.querySelectorAll('tbody tr')).map((f) => botones(f));
    expect(filas).toEqual([['Aceptar', 'Rechazar'], ['Rechazar']]);
    expect(p.raiz.textContent).toContain('Ya aceptaste');
  });

  it('un empleado que no es administrador no ve acciones de aceptación', async () => {
    const p = crearPantalla(ListaCircuitos, 'DISTRIBUIDOR', { sesion: { esAdminEmpresa: false }, entradas: { modo: 'por-aceptar' } });
    await cargar(p, '/api/circuitos/pendientes-aceptacion', [circuito({ estado: 'PENDIENTE_EMPRESAS' })]);

    expect(botones(p.raiz.querySelector('tbody tr') as Element)).toEqual([]);
  });

  it('rechazar pide el motivo y lo manda; un 409 de la API se ve dentro del diálogo', async () => {
    const p = crearPantalla(ListaCircuitos, 'INSPECTOR');
    await cargar(p, '/api/circuitos', [circuito({ inspectorRevisorId: 'i1' })]);

    boton(p.raiz, 'Rechazar').click();
    await enviarDialogo('Farmacia sin habilitar');
    const pedido = await vi.waitFor(() => p.http.expectOne('/api/circuitos/c1/rechazar'));
    expect(pedido.request.body).toEqual({ motivo: 'Farmacia sin habilitar' });
    pedido.flush(...errorApi(409, 'Una de las empresas no está habilitada', 'R5'));

    await vi.waitFor(() => expect(document.querySelector('mc-dialogo-accion [role="alert"]')?.textContent).toContain('Una de las empresas no está habilitada'));
    expect(document.querySelector('mc-dialogo-accion .regla')?.textContent).toBe('R5');
  });

  it('sin circuitos, estado vacío', async () => {
    const p = crearPantalla(ListaCircuitos, 'SEDE_CENTRAL');
    p.responder('/api/circuitos', PAGINA_VACIA);

    await p.esperar(() => expect(p.raiz.textContent).toContain('No hay circuitos con ese filtro.'));
    TestBed.tick();
  });
});
