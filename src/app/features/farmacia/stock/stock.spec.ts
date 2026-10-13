import { PAGINA_VACIA, boton, botones, crearPantalla, enviarDialogo, errorApi, limpiarOverlays, pagina } from '../../../../testing/entorno';
import { Stock } from './stock';

const caja = (cambios: object = {}) => ({
  id: 'c1', gtin: '07799000001010', serie: 'L20260001S000001', estado: 'EN_STOCK', loteId: 'lo1', bloqueado: false, mensajeBloqueo: null, ...cambios,
});

async function cargar(filas: object[]) {
  const p = crearPantalla(Stock, 'FARMACIA');
  p.responder('/api/unidades-trazables', pagina(filas));
  await vi.waitFor(() => p.http.match((r) => r.url === '/api/lotes/lo1').forEach((r) => r.flush({ id: 'lo1', codigo: 'L2026-0001', medicamentoId: 'm1' })));
  await vi.waitFor(() => p.http.match((r) => r.url === '/api/medicamentos/m1').forEach((r) => r.flush({ id: 'm1', nombreComercial: 'Cuyafen' })));
  await p.esperar(() => expect(p.raiz.querySelector('tbody tr')).not.toBeNull());
  return p;
}

describe('Stock', () => {
  afterEach(limpiarOverlays);

  it('muestra medicamento, lote y estado; una caja bloqueada explica por qué (R10 lo calcula el backend)', async () => {
    const p = await cargar([caja({ bloqueado: true, mensajeBloqueo: 'El lote está en cuarentena' })]);

    const fila = p.raiz.querySelector('tbody tr')?.textContent ?? '';
    expect(fila).toContain('Cuyafen');
    expect(fila).toContain('L2026-0001');
    expect(fila).toContain('En stock');
    expect(fila).toContain('No se puede dispensar: El lote está en cuarentena');
  });

  it('solo se ofrece devolver las cajas EN_STOCK', async () => {
    const p = await cargar([caja(), caja({ id: 'c2', estado: 'DISPENSADA' }), caja({ id: 'c3', estado: 'DEVUELTA' })]);

    expect(Array.from(p.raiz.querySelectorAll('tbody tr')).map((f) => botones(f))).toEqual([['Devolver'], [], []]);
  });

  it('el título no dice que todas están en la farmacia: incluye las que vienen en camino, cada una con su estado, y solo las EN_STOCK se devuelven', async () => {
    const p = await cargar([caja(), caja({ id: 'c2', serie: 'L20260001S000002', estado: 'EN_TRANSITO' })]);

    expect(p.raiz.querySelector('mc-tarjeta')?.textContent).toContain('Cajas de tu farmacia y en camino');
    expect(p.raiz.textContent).not.toContain('Cajas en tu farmacia');
    const filas = Array.from(p.raiz.querySelectorAll('tbody tr'));
    expect(filas[0].textContent).toContain('En stock');
    expect(filas[1].textContent).toContain('En tránsito');
    expect(filas.map((f) => botones(f))).toEqual([['Devolver'], []]);
  });

  it('devolver manda GTIN, serie, motivo elegido y observación; un 409 R14 se ve en el diálogo', async () => {
    const p = await cargar([caja()]);

    boton(p.raiz, 'Devolver').click();
    await vi.waitFor(() => expect(document.querySelector('mc-dialogo-accion mat-select')).not.toBeNull());
    (document.querySelector('mc-dialogo-accion mat-select') as HTMLElement).click();
    const opcion = await vi.waitFor(() => {
      const o = Array.from(document.querySelectorAll('mat-option')).find((x) => x.textContent?.includes('Retiro del mercado'));
      expect(o).toBeDefined();
      return o as HTMLElement;
    });
    opcion.click();
    await enviarDialogo('Orden de ANMAT');

    const pedido = await vi.waitFor(() => p.http.expectOne('/api/unidades-trazables/devolucion'));
    expect(pedido.request.body).toEqual({ gtin: '07799000001010', serie: 'L20260001S000001', motivo: 'RETIRO_DEL_MERCADO', observacion: 'Orden de ANMAT' });
    pedido.flush(...errorApi(409, 'La caja ya no está en tu stock', 'R14'));

    await vi.waitFor(() => expect(document.querySelector('mc-dialogo-accion [role="alert"]')?.textContent).toContain('ya no está en tu stock'));
  });

  it('sin cajas, estado vacío', async () => {
    const p = crearPantalla(Stock, 'FARMACIA');
    p.responder('/api/unidades-trazables', PAGINA_VACIA);

    await p.esperar(() => expect(p.raiz.textContent).toContain('No hay cajas en tu farmacia ni en camino todavía.'));
  });
});
