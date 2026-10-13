import { crearPantalla, errorApi, pagina } from '../../../../testing/entorno';
import { FormularioArmarBulto } from './formulario-armar-bulto';

async function iniciar(lotes: object[], circuitos: object[]) {
  const p = crearPantalla(FormularioArmarBulto, 'LABORATORIO');
  await vi.waitFor(() => p.responder('/api/lotes', pagina(lotes)));
  await vi.waitFor(() => p.responder('/api/circuitos', pagina(circuitos)));
  return p;
}

describe('FormularioArmarBulto', () => {
  it('pide solo lotes LIBERADO y circuitos APROBADO', async () => {
    const p = crearPantalla(FormularioArmarBulto, 'LABORATORIO');
    await vi.waitFor(() => expect(p.http.match((r) => r.url === '/api/lotes' && r.params.get('estado') === 'LIBERADO').length).toBe(1));
    await vi.waitFor(() => expect(p.http.match((r) => r.url === '/api/circuitos' && r.params.get('estado') === 'APROBADO').length).toBe(1));
  });

  it('sin lotes liberados o sin circuitos aprobados lo explica y no ofrece el formulario', async () => {
    const p = await iniciar([], []);

    await p.esperar(() => expect(p.raiz.textContent).toContain('No tenés lotes liberados todavía.'));
    expect(p.raiz.textContent).toContain('No tenés circuitos aprobados');
    expect(p.raiz.querySelector('form')).toBeNull();
  });

  it('un 409 R6/R10 de la API se muestra tal cual arriba del formulario', async () => {
    const p = await iniciar(
      [{ id: 'lo1', codigo: 'L2026-0001', cantidad: 400 }],
      [{ id: 'c1', codigo: 'CIR-0001', farmaciaId: 'f1', distribuidorId: 'd1', farmaciaRazonSocial: 'Farmacia Centro', distribuidorRazonSocial: 'Distribuidora Pie de Monte' }],
    );
    await p.esperar(() => expect(p.raiz.querySelector('form')).not.toBeNull());

    const entrada = (etiqueta: string) =>
      Array.from(p.raiz.querySelectorAll('mat-form-field')).find((f) => f.querySelector('mat-label')?.textContent === etiqueta)?.querySelector('input') as HTMLInputElement;
    for (const [etiqueta, valor] of [['Precinto', 'P-88'], ['Cantidad de cajas', '50']]) {
      entrada(etiqueta).value = valor;
      entrada(etiqueta).dispatchEvent(new Event('input'));
    }
    // Lote y circuito (mat-select): se eligen por su opción.
    for (const select of Array.from(p.raiz.querySelectorAll('mat-select'))) {
      (select as HTMLElement).click();
      const opcion = await vi.waitFor(() => {
        const o = document.querySelector('mat-option') as HTMLElement | null;
        expect(o).not.toBeNull();
        return o as HTMLElement;
      });
      opcion.click();
      await vi.waitFor(() => expect(document.querySelector('mat-option')).toBeNull());
    }
    (p.raiz.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));

    const pedido = await vi.waitFor(() => p.http.expectOne('/api/bultos'));
    expect(pedido.request.body).toEqual({ loteId: 'lo1', circuitoId: 'c1', precinto: 'P-88', cantidad: 50 });
    pedido.flush(...errorApi(409, 'Quedan menos cajas libres de las pedidas', 'R6'));

    await vi.waitFor(() => expect(p.raiz.querySelector('mc-error-api [role="alert"]')?.textContent).toContain('Quedan menos cajas libres'));
    expect(p.raiz.querySelector('.regla')?.textContent).toBe('R6');
  });
});
