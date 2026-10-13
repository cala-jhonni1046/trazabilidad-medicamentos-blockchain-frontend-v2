import { PAGINA_VACIA, boton, botones, crearPantalla, enviarDialogo, limpiarOverlays, pagina } from '../../../../testing/entorno';
import { ListaLotes } from './lista-lotes';

const lote = (cambios: object = {}) => ({
  id: 'lo1', codigo: 'L2026-0002', estado: 'PENDIENTE_LIBERACION', cantidad: 10, fechaVencimiento: '2027-12-31',
  medicamentoId: 'm1', laboratorioId: 'l1', medicamentoNombre: 'Vacuna AVX', laboratorioRazonSocial: 'Cuyo Bio S.A.', bloqueado: false, mensajeBloqueo: null, ...cambios,
});

async function cargar(p: ReturnType<typeof crearPantalla<ListaLotes>>, url: string, filas: object[]) {
  p.responder(url, pagina(filas));
  await p.esperar(() => expect(p.raiz.querySelector('tbody tr')).not.toBeNull());
}

describe('ListaLotes', () => {
  afterEach(limpiarOverlays);

  it('muestra medicamento, laboratorio, vencimiento sin correr el día y el bloqueo que calcula el backend', async () => {
    const p = crearPantalla(ListaLotes, 'INSPECTOR');
    await cargar(p, '/api/lotes', [lote({ estado: 'CUARENTENA', bloqueado: true, mensajeBloqueo: 'El lote está en cuarentena' })]);

    const fila = p.raiz.querySelector('tbody tr')?.textContent ?? '';
    expect(fila).toContain('Vacuna AVX');
    expect(fila).toContain('Cuyo Bio S.A.');
    expect(fila).toContain('31/12/2027');
    expect(fila).toContain('Bloqueado: El lote está en cuarentena');
  });

  it('el inspector libera lo pendiente y pone en cuarentena lo liberado; el laboratorio no ve esas acciones', async () => {
    const p = crearPantalla(ListaLotes, 'INSPECTOR');
    await cargar(p, '/api/lotes', [lote(), lote({ id: 'lo2', estado: 'LIBERADO' })]);
    expect(Array.from(p.raiz.querySelectorAll('tbody tr')).map((f) => botones(f))).toEqual([['Liberar'], ['Poner en cuarentena']]);
    limpiarOverlays();
  });

  it('un laboratorio no ve acciones de inspector', async () => {
    const p = crearPantalla(ListaLotes, 'LABORATORIO', { sesion: { empresaId: 'l1' } });
    await cargar(p, '/api/lotes', [lote()]);

    expect(botones(p.raiz.querySelector('tbody tr') as Element)).toEqual([]);
  });

  it('poner en cuarentena manda el motivo elegido y la descripción', async () => {
    const p = crearPantalla(ListaLotes, 'INSPECTOR');
    await cargar(p, '/api/lotes', [lote({ estado: 'LIBERADO' })]);

    boton(p.raiz, 'Poner en cuarentena').click();
    const formulario = await vi.waitFor(() => {
      const f = document.querySelector('mc-dialogo-accion form') as HTMLFormElement;
      expect(f?.querySelector('mat-select')).not.toBeNull();
      return f;
    });
    const select = formulario.querySelector('mat-select') as HTMLElement;
    select.click();
    const opcion = await vi.waitFor(() => {
      const o = Array.from(document.querySelectorAll('mat-option')).find((x) => x.textContent?.includes('Defecto de calidad'));
      expect(o).toBeDefined();
      return o as HTMLElement;
    });
    opcion.click();
    await enviarDialogo('Lote con partículas');

    const pedido = await vi.waitFor(() => p.http.expectOne('/api/cuarentenas'));
    expect(pedido.request.body).toEqual({ loteId: 'lo1', motivo: 'DEFECTO_CALIDAD', descripcion: 'Lote con partículas' });
  });

  it('la bandeja de liberación vacía dice que no hay biológicos', async () => {
    const p = crearPantalla(ListaLotes, 'INSPECTOR', { entradas: { modo: 'bandeja-liberacion' } });
    p.responder('/api/lotes/bandeja-liberacion', PAGINA_VACIA);

    await p.esperar(() => expect(p.raiz.textContent).toContain('No hay biológicos por liberar.'));
  });
});
