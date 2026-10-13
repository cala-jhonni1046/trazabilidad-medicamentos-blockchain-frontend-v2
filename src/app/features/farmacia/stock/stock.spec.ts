import { PAGINA_VACIA, crearPantalla, pagina } from '../../../../testing/entorno';
import { Stock } from './stock';

const caja = (cambios: object = {}) => ({
  id: 'c1', gtin: '07799000001010', serie: 'L20260001S000001', estado: 'EN_STOCK', loteId: 'lo1', loteCodigo: 'L2026-0001', medicamentoNombre: 'Cuyafen', bloqueado: false, mensajeBloqueo: null, ...cambios,
});

describe('Stock', () => {
  it('son dos tarjetas, "En stock" y "En camino", cada una con su pedido ?estado= y su paginador', async () => {
    const p = crearPantalla(Stock, 'FARMACIA');
    await p.esperar(() => expect(p.http.match((r) => r.url === '/api/unidades-trazables').length).toBe(2));
  });

  it('cada tarjeta muestra lo que la API devolvió para su estado', async () => {
    const p = crearPantalla(Stock, 'FARMACIA');
    const pedidos = await vi.waitFor(() => {
      const hechos = p.http.match((r) => r.url === '/api/unidades-trazables');
      expect(hechos.length).toBe(2);
      return hechos;
    });
    for (const pedido of pedidos) {
      const estado = pedido.request.params.get('estado');
      pedido.flush(estado === 'EN_STOCK' ? pagina([caja(), caja({ id: 'c2', serie: 'L20260001S000002' })]) : pagina([caja({ id: 'c3', serie: 'L20260001S000003', estado: 'EN_TRANSITO' })]));
    }

    await p.esperar(() => expect(p.raiz.querySelectorAll('tbody tr').length).toBe(3));
    const tarjetas = Array.from(p.raiz.querySelectorAll('mc-lista-cajas')).map((t) => ({
      titulo: t.querySelector('h2, .titulo')?.textContent?.trim(),
      filas: t.querySelectorAll('tbody tr').length,
      detalle: t.textContent,
    }));
    expect(tarjetas[0].filas).toBe(2);
    expect(tarjetas[0].detalle).toContain('2 en total');
    expect(tarjetas[1].filas).toBe(1);
    expect(tarjetas[1].detalle).toContain('En tránsito');
    expect(p.raiz.textContent).not.toContain('Cajas en tu farmacia');
  });

  it('sin cajas, cada tarjeta lo dice con su propio texto', async () => {
    const p = crearPantalla(Stock, 'FARMACIA');
    await vi.waitFor(() => p.http.match((r) => r.url === '/api/unidades-trazables').forEach((r) => r.flush(PAGINA_VACIA)));

    await p.esperar(() => {
      expect(p.raiz.textContent).toContain('No tenés cajas en stock todavía.');
      expect(p.raiz.textContent).toContain('No hay cajas en camino hacia tu farmacia.');
    });
  });
});
