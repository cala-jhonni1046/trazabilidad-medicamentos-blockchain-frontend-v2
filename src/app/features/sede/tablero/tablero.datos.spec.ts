import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { proveerClienteApi } from '../../../core/api/api.providers';
import { PAGINA_VACIA, pagina, responderMosaicos } from './soporte-pruebas';
import { TableroDatos } from './tablero.datos';

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
  it('pide el resumen con UN solo pedido a /api/tablero/resumen (ya no son 7 conteos)', () => {
    const { http } = crear();

    expect(http.match((p) => p.url === '/api/tablero/resumen').length).toBe(1);
    expect(http.match((p) => p.url === '/api/empresas' || p.url === '/api/inspectores-anmat' || p.url === '/api/circuitos').length).toBe(0);
    expect(http.match((p) => p.url === '/api/eventos-trazabilidad' || p.url === '/api/registros-blockchain' || p.url === '/api/cuarentenas').length).toBe(0);
  });

  it('muestra los totales y resalta con atención lo pendiente y las cuarentenas activas', async () => {
    const { datos, http } = crear();
    expect(datos.mosaicos().every((m) => m.estado === 'cargando')).toBe(true);

    responderMosaicos(http, { empresas: 9, empresasPendientes: 2, inspectoresActivos: 3, cuarentenasActivas: 0, anclajesConfirmados: 4 });
    await esperarMosaicos(datos);

    const por = Object.fromEntries(datos.mosaicos().map((m) => [m.clave, m]));
    expect(por['empresas']).toMatchObject({ valor: 9, estado: 'listo', tono: null });
    expect(por['empresasPendientes']).toMatchObject({ valor: 2, tono: 'atencion' });
    expect(por['inspectoresActivos'].valor).toBe(3);
    expect(por['cuarentenasActivas']).toMatchObject({ valor: 0, tono: null });
    expect(por['anclajesConfirmados']).toMatchObject({ valor: 4, etiqueta: 'Anclajes confirmados en Sepolia' });
  });

  it('si falla el resumen, los 7 mosaicos se marcan "error" (y las listas de pendientes no dependen de él)', async () => {
    const { datos, http } = crear();

    responderMosaicos(http, {}, true);
    http.match((p) => p.url === '/api/empresas/sin-inspector')[0].flush(pagina([], 0));
    await esperarMosaicos(datos);

    expect(datos.mosaicos().map((m) => m.estado)).toEqual(Array(7).fill('error'));
    await vi.waitFor(() => expect(datos.empresasSinInspector.hasValue()).toBe(true));
  });

  it('los circuitos sin inspector traen las razones sociales de sus tres empresas (sin pedirlas aparte)', async () => {
    const { datos, http } = crear();
    const circuito = {
      id: 'c1', codigo: 'CIR-0007', laboratorioRazonSocial: 'Lab Andino', distribuidorRazonSocial: 'Distribuidora Pie de Monte',
      farmaciaRazonSocial: 'Farmacia Salteña', fechaPropuesta: '2026-10-08T18:00:00Z',
    };

    http.match((p) => p.url === '/api/circuitos/sin-inspector')[0].flush(pagina([circuito], 1));

    await vi.waitFor(() => expect(datos.circuitosSinInspector.hasValue()).toBe(true));
    expect(datos.circuitosSinInspector.value()?.elementos[0]).toMatchObject({ farmaciaRazonSocial: 'Farmacia Salteña' });
    http.expectNone((p) => p.url.startsWith('/api/empresas/') && p.url !== '/api/empresas/sin-inspector');
  });

  it('una lista de circuitos vacía no deja el recurso colgado', async () => {
    const { datos, http } = crear();

    http.match((p) => p.url === '/api/circuitos/sin-inspector')[0].flush(PAGINA_VACIA);

    await vi.waitFor(() => expect(datos.circuitosSinInspector.hasValue()).toBe(true));
    expect(datos.circuitosSinInspector.value()).toEqual({ elementos: [], total: 0 });
  });

  it('cargarInspectores pide los ACTIVO (máx. 100) y arma "Nombre Apellido" con lo que trae cada inspector', async () => {
    const { datos, http } = crear();
    const inspectores = [
      { id: 'i0', legajo: 'L-0', provincia: 'MENDOZA', usuarioId: 'u0', nombre: 'Laura', apellido: 'Gómez' },
      { id: 'i1', legajo: 'L-1', provincia: 'SAN_JUAN', usuarioId: 'u1', nombre: 'Pablo', apellido: 'Funes' },
    ];

    const promesa = datos.cargarInspectores();
    const pedido = http.expectOne((p) => p.url === '/api/inspectores-anmat' && p.params.get('size') === '100');
    expect(pedido.request.params.get('estado')).toBe('ACTIVO');
    pedido.flush(pagina(inspectores));
    const resultado = await promesa;

    expect(resultado).toEqual({
      ok: true,
      valor: [
        { id: 'i0', legajo: 'L-0', provincia: 'MENDOZA', nombre: 'Laura Gómez' },
        { id: 'i1', legajo: 'L-1', provincia: 'SAN_JUAN', nombre: 'Pablo Funes' },
      ],
    });
    http.expectNone((p) => p.url.startsWith('/api/usuarios/'));
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

  it('recargar() vuelve a pedir el resumen y las listas', async () => {
    const { datos, http } = crear();
    responderMosaicos(http);
    http.match((p) => p.url === '/api/empresas/sin-inspector')[0].flush(PAGINA_VACIA);
    http.match((p) => p.url === '/api/circuitos/sin-inspector')[0].flush(PAGINA_VACIA);
    await esperarMosaicos(datos);

    datos.recargar();

    await vi.waitFor(() => {
      TestBed.tick();
      expect(http.match((p) => p.url === '/api/tablero/resumen').length).toBe(1);
    });
    expect(http.match((p) => p.url === '/api/empresas/sin-inspector').length).toBe(1);
    expect(http.match((p) => p.url === '/api/circuitos/sin-inspector').length).toBe(1);
  });
});
