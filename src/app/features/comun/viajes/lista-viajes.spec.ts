import { boton, botones, crearPantalla, enviarDialogo, errorApi, limpiarOverlays, pagina } from '../../../../testing/entorno';
import { ListaViajes } from './lista-viajes';

const viaje = (cambios: object = {}) => ({
  id: 'v1', codigo: 'VJ-0001', tramo: 'LAB_A_DISTRIBUIDOR', estado: 'PROGRAMADO', origenId: 'l1', patente: 'AB123CD', chofer: 'Juan Camión',
  fechaEstimadaEntrega: '2026-10-09T18:00:00Z', fechaSalida: null, bultoCodigos: ['BUL-0001', 'BUL-0002'], ...cambios,
});

async function cargar(rol: 'LABORATORIO' | 'DISTRIBUIDOR', filas: object[]) {
  const p = crearPantalla(ListaViajes, rol, { sesion: { empresaId: rol === 'LABORATORIO' ? 'l1' : 'd1' } });
  p.responder('/api/viajes', pagina(filas));
  await vi.waitFor(() => p.http.match((r) => r.url === '/api/empresas/l1').forEach((r) => r.flush({ id: 'l1', razonSocial: 'Lab Andino' })));
  await p.esperar(() => expect(p.raiz.querySelector('tbody tr')).not.toBeNull());
  return p;
}

describe('ListaViajes', () => {
  afterEach(limpiarOverlays);

  it('el origen del viaje programado puede registrar la salida o cancelarlo', async () => {
    const p = await cargar('LABORATORIO', [viaje()]);

    expect(botones(p.raiz.querySelector('tbody tr') as Element)).toEqual(['Registrar salida', 'Cancelar']);
    expect(p.raiz.textContent).toContain('sale de Lab Andino');
    expect(p.raiz.textContent).toContain('Laboratorio → Distribuidora');
    expect(p.raiz.textContent).toContain('BUL-0001');
    expect(p.raiz.textContent).toContain('09/10/2026 15:00');
  });

  it('en tránsito: el origen puede reportar robo y ver la temperatura; la receptora solo ve la temperatura', async () => {
    const origen = await cargar('LABORATORIO', [viaje({ estado: 'EN_TRANSITO', fechaSalida: '2026-10-08T12:00:00Z' })]);
    expect(botones(origen.raiz.querySelector('tbody tr') as Element)).toEqual(['Reportar robo', 'Temperatura']);
  });

  it('la distribuidora que recibe no ve acciones del origen', async () => {
    const p = await cargar('DISTRIBUIDOR', [viaje({ estado: 'EN_TRANSITO' })]);

    expect(botones(p.raiz.querySelector('tbody tr') as Element)).toEqual(['Temperatura']);
  });

  it('un viaje cancelado o programado no ofrece temperatura; uno cancelado, tampoco acciones', async () => {
    const p = await cargar('LABORATORIO', [viaje({ estado: 'CANCELADO' })]);

    expect(botones(p.raiz.querySelector('tbody tr') as Element)).toEqual([]);
  });

  it('registrar la salida con un bulto bloqueado: el 409 R10 de la API se ve dentro del diálogo', async () => {
    const p = await cargar('LABORATORIO', [viaje()]);

    boton(p.raiz, 'Registrar salida').click();
    await enviarDialogo();
    p.http.expectOne('/api/viajes/v1/salida').flush(...errorApi(409, 'El bulto BUL-0002 está bloqueado', 'R10'));

    await vi.waitFor(() => expect(document.querySelector('mc-dialogo-accion [role="alert"]')?.textContent).toContain('está bloqueado'));
    expect(document.querySelector('mc-dialogo-accion .regla')?.textContent).toBe('R10');
  });

  it('cancelar manda el motivo; reportar robo, lo que pasó', async () => {
    const p = await cargar('LABORATORIO', [viaje()]);

    boton(p.raiz, 'Cancelar').click();
    await enviarDialogo('Camión averiado');
    const pedido = await vi.waitFor(() => p.http.expectOne('/api/viajes/v1/cancelar'));
    expect(pedido.request.body).toEqual({ motivo: 'Camión averiado' });
  });

  it('"Temperatura" trae las lecturas del viaje y las muestra en el gráfico', async () => {
    const p = await cargar('LABORATORIO', [viaje({ estado: 'EN_TRANSITO' })]);

    boton(p.raiz, 'Temperatura').click();
    const pedido = await vi.waitFor(() => p.http.expectOne((r) => r.url === '/api/viajes/v1/telemetria-temperatura'));
    pedido.flush(pagina([
      { id: 't1', fechaHora: '2026-10-08T12:00:00Z', temperatura: 5, fueraDeRango: false },
      { id: 't2', fechaHora: '2026-10-08T12:10:00Z', temperatura: 12, fueraDeRango: true },
    ]));

    await p.esperar(() => expect(p.raiz.querySelector('mc-grafico-temperatura svg')).not.toBeNull());
    expect(p.raiz.querySelectorAll('rect.punto.fuera').length).toBe(1);
  });
});
