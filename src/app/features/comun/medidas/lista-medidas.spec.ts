import { boton, botones, crearPantalla, enviarDialogo, errorApi, limpiarOverlays, pagina } from '../../../../testing/entorno';
import { ListaMedidas } from './lista-medidas';

const medida = (cambios: object = {}) => ({
  id: 'q1', alcance: 'LOTE', tipo: 'CUARENTENA', motivo: 'DEFECTO_CALIDAD', estado: 'ACTIVA', automatica: false, provincia: 'MENDOZA',
  fechaInicio: '2026-10-08T18:00:00Z', loteId: 'lo1', loteCodigo: 'L2026-0001', bultoIds: [], inspectorRevisorId: null, descripcion: 'Partículas', ...cambios,
});

async function cargar(p: ReturnType<typeof crearPantalla<ListaMedidas>>, filas: object[]) {
  p.responder('/api/cuarentenas', pagina(filas));
  await p.esperar(() => expect(p.raiz.querySelector('tbody tr')).not.toBeNull());
}

describe('ListaMedidas', () => {
  afterEach(limpiarOverlays);

  it('muestra el lote por su código, el motivo y si es automática', async () => {
    const p = crearPantalla(ListaMedidas, 'INSPECTOR');
    await cargar(p, [medida({ automatica: true })]);

    const fila = p.raiz.querySelector('tbody tr')?.textContent ?? '';
    expect(fila).toContain('Lote L2026-0001');
    expect(fila).toContain('Defecto de calidad');
    expect(fila).toContain('automática');
  });

  it('inspector: activa sin tomar → Tomar; tomada → Levantar y Recall; levantada → nada', async () => {
    const p = crearPantalla(ListaMedidas, 'INSPECTOR');
    await cargar(p, [medida(), medida({ id: 'q2', inspectorRevisorId: 'i1' }), medida({ id: 'q3', estado: 'LEVANTADA' })]);

    expect(Array.from(p.raiz.querySelectorAll('tbody tr')).map((f) => botones(f))).toEqual([['Tomar'], ['Levantar', 'Recall'], []]);
  });

  it('una empresa ve las medidas pero no puede actuar sobre ellas', async () => {
    const p = crearPantalla(ListaMedidas, 'FARMACIA');
    await cargar(p, [medida({ inspectorRevisorId: 'i1' })]);

    expect(botones(p.raiz.querySelector('tbody tr') as Element)).toEqual([]);
  });

  it('levantar una ruptura de frío: el 409 R9 de la API se muestra tal cual en el diálogo', async () => {
    const p = crearPantalla(ListaMedidas, 'INSPECTOR');
    await cargar(p, [medida({ motivo: 'RUPTURA_FRIO', inspectorRevisorId: 'i1' })]);

    boton(p.raiz, 'Levantar').click();
    await enviarDialogo('Se verificó la temperatura');
    const pedido = await vi.waitFor(() => p.http.expectOne('/api/cuarentenas/q1/levantar'));
    expect(pedido.request.body).toEqual({ fundamento: 'Se verificó la temperatura' });
    pedido.flush(...errorApi(409, 'Tras una ruptura de frío solo cabe el recall', 'R9'));

    await vi.waitFor(() => expect(document.querySelector('mc-dialogo-accion [role="alert"]')?.textContent).toContain('solo cabe el recall'));
    expect(document.querySelector('mc-dialogo-accion .regla')?.textContent).toBe('R9');
  });
});
