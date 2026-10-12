import { PAGINA_VACIA, boton, botones, crearPantalla, enviarDialogo, errorApi, limpiarOverlays, pagina } from '../../../../testing/entorno';
import { ListaBultos } from './lista-bultos';

const bulto = (cambios: object = {}) => ({
  id: 'b1', codigo: 'BUL-0001', precinto: 'P-77', cantidad: 200, estado: 'ARMADO', loteId: 'lo1', destinoId: 'f1', viajeActualId: null, bloqueado: false, ...cambios,
});

async function cargar(rol: 'LABORATORIO' | 'DISTRIBUIDOR', modo: 'laboratorio' | 'deposito', filas: object[]) {
  const p = crearPantalla(ListaBultos, rol, { entradas: { modo } });
  p.responder('/api/bultos', pagina(filas));
  await vi.waitFor(() => p.http.match((r) => r.url === '/api/lotes/lo1').forEach((r) => r.flush({ id: 'lo1', codigo: 'L2026-0001' })));
  await vi.waitFor(() => p.http.match((r) => r.url === '/api/empresas/f1').forEach((r) => r.flush({ id: 'f1', razonSocial: 'Farmacia Centro' })));
  await p.esperar(() => expect(p.raiz.querySelector('tbody tr')).not.toBeNull());
  return p;
}

describe('ListaBultos', () => {
  afterEach(limpiarOverlays);

  it('muestra el lote por su código, la farmacia de destino y el bloqueo que calcula el backend', async () => {
    const p = await cargar('LABORATORIO', 'laboratorio', [bulto({ estado: 'ROBADO', bloqueado: true, mensajeBloqueo: 'Bulto con medida vigente' })]);

    const fila = p.raiz.querySelector('tbody tr')?.textContent ?? '';
    expect(fila).toContain('L2026-0001');
    expect(fila).toContain('Farmacia Centro');
    expect(fila).toContain('Precinto P-77');
    expect(fila).toContain('Robado');
    expect(fila).toContain('Bloqueado: Bulto con medida vigente');
  });

  it('el laboratorio desarma solo los ARMADO que no tienen viaje', async () => {
    const p = await cargar('LABORATORIO', 'laboratorio', [bulto(), bulto({ id: 'b2', viajeActualId: 'v1' }), bulto({ id: 'b3', estado: 'EN_TRANSITO' })]);

    expect(Array.from(p.raiz.querySelectorAll('tbody tr')).map((f) => botones(f))).toEqual([['Desarmar'], [], []]);
  });

  it('desarmar confirma y llama a la API; un 409 se ve dentro del diálogo', async () => {
    const p = await cargar('LABORATORIO', 'laboratorio', [bulto()]);

    boton(p.raiz, 'Desarmar').click();
    await enviarDialogo();
    p.http.expectOne('/api/bultos/b1/desarmar').flush(...errorApi(409, 'El bulto ya tiene un viaje', 'TRANSICION_INVALIDA'));

    await vi.waitFor(() => expect(document.querySelector('mc-dialogo-accion [role="alert"]')?.textContent).toContain('ya tiene un viaje'));
  });

  it('el depósito de la distribuidora pide solo los EN_DEPOSITO y no tiene acciones ni filtro', async () => {
    const p = crearPantalla(ListaBultos, 'DISTRIBUIDOR', { entradas: { modo: 'deposito' } });
    const pedido = p.http.match((r) => r.url === '/api/bultos')[0];
    expect(pedido.request.params.get('estado')).toBe('EN_DEPOSITO');
    pedido.flush(PAGINA_VACIA);

    await p.esperar(() => expect(p.raiz.textContent).toContain('El depósito está vacío.'));
    expect(p.raiz.querySelector('mc-filtro-estado')).toBeNull();
  });
});
