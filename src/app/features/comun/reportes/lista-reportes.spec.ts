import { boton, botones, crearPantalla, enviarDialogo, limpiarOverlays, pagina } from '../../../../testing/entorno';
import { ListaReportes } from './lista-reportes';

const reporte = (cambios: object = {}) => ({
  id: 'r1', codigo: 'REP-0001', gtinReportado: '07799000001010', serieReportada: 'L20260001S000001', motivo: 'ENVASE_DANADO',
  descripcion: 'El precinto estaba abierto', estado: 'ABIERTO', provincia: 'MENDOZA', fechaReporte: '2026-10-08T18:00:00Z', cajaExiste: true, ...cambios,
});

async function cargar(p: ReturnType<typeof crearPantalla<ListaReportes>>, filas: object[]) {
  p.responder('/api/reportes-ciudadanos', pagina(filas));
  await p.esperar(() => expect(p.raiz.querySelector('tbody tr')).not.toBeNull());
}

describe('ListaReportes', () => {
  afterEach(limpiarOverlays);

  it('inspector: abierto → Tomar el caso; en investigación → Cerrar y medidas sobre el lote', async () => {
    const p = crearPantalla(ListaReportes, 'INSPECTOR');
    await cargar(p, [reporte(), reporte({ id: 'r2', estado: 'EN_INVESTIGACION' }), reporte({ id: 'r3', estado: 'CERRADO', conclusion: 'Falso positivo' })]);

    expect(Array.from(p.raiz.querySelectorAll('tbody tr')).map((f) => botones(f))).toEqual([
      ['Ver caja', 'Tomar el caso'],
      ['Ver caja', 'Cerrar caso', 'Tomar medidas sobre el lote'],
      ['Ver caja'],
    ]);
    expect(p.raiz.textContent).toContain('Conclusión: Falso positivo');
  });

  it('muestra lo que escribió el paciente pero ningún dato de su identidad', async () => {
    const p = crearPantalla(ListaReportes, 'INSPECTOR');
    await cargar(p, [{ ...reporte(), dni: '30456789', paciente: 'Juan Pérez' }]);

    expect(p.raiz.textContent).toContain('El precinto estaba abierto');
    expect(p.raiz.textContent).not.toContain('30456789');
    expect(p.raiz.textContent).not.toContain('Juan Pérez');
  });

  it('"Ver caja" consulta la verificación pública con el GTIN y la serie reportados', async () => {
    const p = crearPantalla(ListaReportes, 'INSPECTOR');
    await cargar(p, [reporte()]);

    boton(p.raiz, 'Ver caja').click();
    const pedido = await vi.waitFor(() => p.http.expectOne((r) => r.url === '/api/verificacion'));
    expect(pedido.request.params.get('gtin')).toBe('07799000001010');
    expect(pedido.request.params.get('serie')).toBe('L20260001S000001');
    pedido.flush({ estado: 'EN_DISTRIBUCION', gtin: '07799000001010', serie: 'L20260001S000001', mensaje: 'Todavía no llegó a una farmacia', recorrido: [] });

    await p.esperar(() => expect(p.raiz.querySelector('mc-resultado-verificacion .mensaje')?.textContent).toContain('Todavía no llegó'));
  });

  it('cerrar el caso manda la conclusión', async () => {
    const p = crearPantalla(ListaReportes, 'INSPECTOR');
    await cargar(p, [reporte({ estado: 'EN_INVESTIGACION' })]);

    boton(p.raiz, 'Cerrar caso').click();
    await enviarDialogo('Se retiró el lote');

    const pedido = await vi.waitFor(() => p.http.expectOne('/api/reportes-ciudadanos/r1/cerrar'));
    expect(pedido.request.body).toEqual({ conclusion: 'Se retiró el lote' });
  });
});
