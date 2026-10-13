import { PAGINA_VACIA, boton, botones, crearPantalla, enviarDialogo, errorApi, limpiarOverlays, pagina } from '../../../../testing/entorno';
import { ListaCajas } from './lista-cajas';

const caja = (cambios: object = {}) => ({
  id: 'c1', gtin: '07799000001010', serie: 'L20260001S000001', estado: 'EN_STOCK', loteId: 'lo1', loteCodigo: 'L2026-0001', medicamentoNombre: 'Cuyafen', bloqueado: false, mensajeBloqueo: null, ...cambios,
});

/** La tarjeta de las cajas EN_STOCK (con "Devolver"), con el listado ya respondido. */
async function cargar(filas: object[], entradas: Record<string, unknown> = {}) {
  const p = crearPantalla(ListaCajas, 'FARMACIA', {
    entradas: { estado: 'EN_STOCK', titulo: 'En stock', textoVacio: 'No tenés cajas en stock todavía.', devolvible: true, ...entradas },
  });
  const pedido = p.responder('/api/unidades-trazables', pagina(filas));
  await p.esperar(() => expect(p.raiz.querySelector('tbody tr')).not.toBeNull());
  return { ...p, pedido };
}

describe('ListaCajas', () => {
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

  it('pide a la API solo las cajas de su estado (?estado=) y las muestra con el nombre y el lote que trae cada una', async () => {
    const p = await cargar([caja()]);

    expect(p.pedido.request.params.get('estado')).toBe('EN_STOCK');
    expect(p.raiz.querySelector('mc-tarjeta')?.textContent).toContain('En stock');
    expect(p.http.match((r) => r.url.startsWith('/api/lotes/') || r.url.startsWith('/api/medicamentos/')).length).toBe(0);
  });

  it('la tarjeta "En camino": cajas EN_TRANSITO, sin acción de devolver aunque se las vea', async () => {
    const p = await cargar([caja({ estado: 'EN_TRANSITO' })], { estado: 'EN_TRANSITO', titulo: 'En camino', devolvible: false });

    expect(p.pedido.request.params.get('estado')).toBe('EN_TRANSITO');
    expect(p.raiz.querySelector('tbody tr')?.textContent).toContain('En tránsito');
    expect(botones(p.raiz.querySelector('tbody tr') as Element)).toEqual([]);
  });

  it('solo se ofrece devolver las cajas EN_STOCK de una tarjeta que lo permite', async () => {
    const p = await cargar([caja(), caja({ id: 'c2', estado: 'EN_TRANSITO' })]);

    expect(Array.from(p.raiz.querySelectorAll('tbody tr')).map((f) => botones(f))).toEqual([['Devolver'], []]);
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

  it('sin cajas, dice el texto que le dieron', async () => {
    const p = crearPantalla(ListaCajas, 'FARMACIA', {
      entradas: { estado: 'EN_TRANSITO', titulo: 'En camino', textoVacio: 'No hay cajas en camino hacia tu farmacia.' },
    });
    p.responder('/api/unidades-trazables', PAGINA_VACIA);

    await p.esperar(() => expect(p.raiz.textContent).toContain('No hay cajas en camino hacia tu farmacia.'));
  });
});
