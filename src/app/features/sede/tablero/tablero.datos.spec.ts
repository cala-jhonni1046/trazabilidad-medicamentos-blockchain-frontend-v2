import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { proveerClienteApi } from '../../../core/api/api.providers';
import { PAGINA_VACIA, pagina, pedidosA, responderMosaicos } from './soporte-pruebas';
import { MAXIMO_NOMBRES_INSPECTORES, TableroDatos } from './tablero.datos';

function crear() {
  TestBed.configureTestingModule({
    providers: [TableroDatos, provideHttpClient(), provideHttpClientTesting(), proveerClienteApi()],
  });
  const datos = TestBed.inject(TableroDatos);
  const http = TestBed.inject(HttpTestingController);
  TestBed.tick();
  return { datos, http };
}

/** Espera a que los 7 mosaicos dejen de estar "cargando" (rxResource actualiza su valor de forma asíncrona). */
async function esperarMosaicos(datos: TableroDatos): Promise<void> {
  await vi.waitFor(() => {
    TestBed.tick();
    expect(datos.mosaicos().every((m) => m.estado !== 'cargando')).toBe(true);
  });
}

describe('TableroDatos', () => {
  it('pide los 7 conteos con size=1 y los filtros por estado correctos', () => {
    const { http } = crear();

    expect(pedidosA(http, '/api/empresas', 'PENDIENTE').length).toBe(1);
    expect(pedidosA(http, '/api/inspectores-anmat', 'ACTIVO').length).toBe(1);
    expect(pedidosA(http, '/api/circuitos', 'APROBADO').length).toBe(1);
    expect(pedidosA(http, '/api/cuarentenas', 'ACTIVA').length).toBe(1);
    expect(http.match((p) => p.url === '/api/eventos-trazabilidad').length).toBe(1);
    expect(http.match((p) => p.url === '/api/registros-blockchain').length).toBe(1);
    // Empresas sin filtro + pendientes con filtro, ambas size=1 (las 2 de /api/empresas restantes son una).
    expect(http.match((p) => p.url === '/api/empresas' && !p.params.has('estado')).length).toBe(1);
  });

  it('muestra los totales y resalta con atención lo pendiente y las cuarentenas activas', async () => {
    const { datos, http } = crear();
    expect(datos.mosaicos().every((m) => m.estado === 'cargando')).toBe(true);

    responderMosaicos(http, { empresas: 9, 'empresas-pendientes': 2, 'inspectores-activos': 3, 'cuarentenas-activas': 0 });
    await esperarMosaicos(datos);

    const por = Object.fromEntries(datos.mosaicos().map((m) => [m.clave, m]));
    expect(por['empresas']).toMatchObject({ valor: 9, estado: 'listo', tono: null });
    expect(por['empresas-pendientes']).toMatchObject({ valor: 2, tono: 'atencion' });
    expect(por['inspectores-activos'].valor).toBe(3);
    expect(por['cuarentenas-activas']).toMatchObject({ valor: 0, tono: null });
  });

  it('un mosaico que falla se marca "error" y NO afecta a los demás', async () => {
    const { datos, http } = crear();

    responderMosaicos(http, { empresas: 5, eventos: 40 }, ['circuitos-aprobados']);
    await esperarMosaicos(datos);

    const por = Object.fromEntries(datos.mosaicos().map((m) => [m.clave, m]));
    expect(por['circuitos-aprobados']).toMatchObject({ estado: 'error', valor: null });
    expect(por['empresas']).toMatchObject({ estado: 'listo', valor: 5 });
    expect(por['eventos']).toMatchObject({ estado: 'listo', valor: 40 });
  });

  it('los circuitos sin inspector llevan los nombres de sus tres empresas y la provincia de la farmacia', async () => {
    const { datos, http } = crear();
    const circuito = { id: 'c1', codigo: 'CIR-0007', laboratorioId: 'l1', distribuidorId: 'd1', farmaciaId: 'f1', fechaPropuesta: '2026-10-08T18:00:00Z' };

    http.match((p) => p.url === '/api/circuitos/sin-inspector')[0].flush(pagina([circuito], 1));
    for (const [id, nombre, provincia] of [['l1', 'Lab Andino', 'MENDOZA'], ['d1', 'Distribuidora Pie de Monte', 'MENDOZA'], ['f1', 'Farmacia Salteña', 'SALTA']]) {
      await vi.waitFor(() => http.expectOne(`/api/empresas/${id}`).flush({ id, razonSocial: nombre, provincia }));
    }
    TestBed.tick();

    await vi.waitFor(() => expect(datos.circuitosSinInspector.hasValue()).toBe(true));
    const [pendiente] = datos.circuitosSinInspector.value()?.elementos ?? [];
    expect(pendiente).toMatchObject({
      laboratorio: 'Lab Andino',
      distribuidor: 'Distribuidora Pie de Monte',
      farmacia: 'Farmacia Salteña',
      provinciaFarmacia: 'SALTA',
    });
  });

  it('si no se puede leer una empresa del circuito, usa un texto neutro y no falla', async () => {
    const { datos, http } = crear();
    const circuito = { id: 'c1', codigo: 'CIR-0008', laboratorioId: 'l1', distribuidorId: 'd1', farmaciaId: 'f1' };

    http.match((p) => p.url === '/api/circuitos/sin-inspector')[0].flush(pagina([circuito], 1));
    for (const id of ['l1', 'd1', 'f1']) {
      await vi.waitFor(() =>
        http.expectOne(`/api/empresas/${id}`).flush(
          { status: 404, message: 'No encontrada', regla: null, errors: null },
          { status: 404, statusText: 'Not Found' },
        ),
      );
    }

    await vi.waitFor(() => expect(datos.circuitosSinInspector.hasValue()).toBe(true));
    expect(datos.circuitosSinInspector.value()?.elementos[0]).toMatchObject({
      farmacia: 'Empresa (sin datos)',
      provinciaFarmacia: null,
    });
  });

  it('una lista de circuitos vacía no deja el recurso colgado', async () => {
    const { datos, http } = crear();

    http.match((p) => p.url === '/api/circuitos/sin-inspector')[0].flush(PAGINA_VACIA);

    await vi.waitFor(() => expect(datos.circuitosSinInspector.hasValue()).toBe(true));
    expect(datos.circuitosSinInspector.value()).toEqual({ elementos: [], total: 0 });
  });

  it('cargarInspectores pide los ACTIVO (máx. 100) y busca el nombre solo de los primeros 30', async () => {
    const { datos, http } = crear();
    const inspectores = Array.from({ length: MAXIMO_NOMBRES_INSPECTORES + 5 }, (_, i) => ({
      id: `i${i}`,
      legajo: `L-${i}`,
      provincia: 'MENDOZA',
      usuarioId: `u${i}`,
    }));

    const promesa = datos.cargarInspectores();
    const pedido = http.expectOne((p) => p.url === '/api/inspectores-anmat' && p.params.get('size') === '100');
    expect(pedido.request.params.get('estado')).toBe('ACTIVO');
    pedido.flush(pagina(inspectores));
    for (let i = 0; i < MAXIMO_NOMBRES_INSPECTORES; i++) {
      await vi.waitFor(() => http.expectOne(`/api/usuarios/u${i}`).flush({ nombre: `Nombre${i}`, apellido: 'Apellido' }));
    }
    const resultado = await promesa;

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.valor.length).toBe(MAXIMO_NOMBRES_INSPECTORES + 5);
      expect(resultado.valor[0].nombre).toBe('Nombre0 Apellido');
      expect(resultado.valor[MAXIMO_NOMBRES_INSPECTORES].nombre).toBeNull();
    }
    http.expectNone((p) => p.url === `/api/usuarios/u${MAXIMO_NOMBRES_INSPECTORES}`);
  });

  it('cargarInspectores guarda el resultado, pero no un fallo', async () => {
    const { datos, http } = crear();

    const primera = datos.cargarInspectores();
    http.expectOne((p) => p.url === '/api/inspectores-anmat' && p.params.get('size') === '100').flush(
      { status: 500, message: 'Error interno', regla: null, errors: null },
      { status: 500, statusText: 'Server Error' },
    );
    expect((await primera).ok).toBe(false);

    const segunda = datos.cargarInspectores();
    http.expectOne((p) => p.url === '/api/inspectores-anmat' && p.params.get('size') === '100').flush(PAGINA_VACIA);
    expect(await segunda).toEqual({ ok: true, valor: [] });

    // Con éxito queda guardado: no hay un tercer pedido.
    await datos.cargarInspectores();
    http.expectNone((p) => p.url === '/api/inspectores-anmat' && p.params.get('size') === '100');
  });

  it('asignarEmpresa y asignarCircuito mandan el inspectorId a su ruta', async () => {
    const { datos, http } = crear();

    const empresa = datos.asignarEmpresa('e1', 'i1');
    const pedidoEmpresa = http.expectOne('/api/empresas/e1/asignar');
    expect(pedidoEmpresa.request.method).toBe('POST');
    expect(pedidoEmpresa.request.body).toEqual({ inspectorId: 'i1' });
    pedidoEmpresa.flush({ id: 'e1' });
    expect((await empresa).ok).toBe(true);

    const circuito = datos.asignarCircuito('c1', 'i2');
    const pedidoCircuito = http.expectOne('/api/circuitos/c1/asignar');
    expect(pedidoCircuito.request.body).toEqual({ inspectorId: 'i2' });
    pedidoCircuito.flush({ id: 'c1' });
    expect((await circuito).ok).toBe(true);
  });

  it('un 409 al asignar vuelve como error de la API, sin decidir nada en el cliente (R2)', async () => {
    const { datos, http } = crear();

    const promesa = datos.asignarEmpresa('e1', 'i1');
    http.expectOne('/api/empresas/e1/asignar').flush(
      { status: 409, message: 'La provincia ya tiene inspectores activos', regla: 'R2', errors: null },
      { status: 409, statusText: 'Conflict' },
    );
    const resultado = await promesa;

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error.regla).toBe('R2');
      expect(resultado.error.mensaje).toBe('La provincia ya tiene inspectores activos');
    }
  });

  it('recargar() vuelve a pedir los mosaicos y las listas', async () => {
    const { datos, http } = crear();
    responderMosaicos(http);
    http.match((p) => p.url === '/api/empresas/sin-inspector')[0].flush(PAGINA_VACIA);
    http.match((p) => p.url === '/api/circuitos/sin-inspector')[0].flush(PAGINA_VACIA);
    await esperarMosaicos(datos);

    datos.recargar();

    await vi.waitFor(() => {
      TestBed.tick();
      expect(http.match((p) => p.url === '/api/registros-blockchain').length).toBe(1);
    });
    expect(http.match((p) => p.url === '/api/empresas/sin-inspector').length).toBe(1);
    expect(http.match((p) => p.url === '/api/circuitos/sin-inspector').length).toBe(1);
  });
});
