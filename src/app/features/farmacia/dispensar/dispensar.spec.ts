import { PAGINA_VACIA, boton, crearPantalla, enviarDialogo, errorApi, limpiarOverlays, pagina } from '../../../../testing/entorno';
import { Dispensar } from './dispensar';

function iniciar() {
  const p = crearPantalla(Dispensar, 'FARMACIA');
  p.responder('/api/dispensaciones', PAGINA_VACIA);
  return p;
}

function escribir(raiz: HTMLElement, etiqueta: string, valor: string) {
  const campo = Array.from(raiz.querySelectorAll('mat-form-field')).find((f) => f.querySelector('mat-label')?.textContent === etiqueta)?.querySelector('input') as HTMLInputElement;
  campo.value = valor;
  campo.dispatchEvent(new Event('input'));
}

const enviar = (raiz: HTMLElement) => (raiz.querySelector('mc-formulario-dispensar form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));

describe('Dispensar', () => {
  afterEach(limpiarOverlays);

  it('sin completar pide GTIN, serie y receta, y no llama a la API', async () => {
    const p = iniciar();

    enviar(p.raiz);

    await p.esperar(() => expect(p.raiz.textContent).toContain('Escribí el número de receta.'));
    expect(p.raiz.textContent).toContain('Escribí el GTIN de la caja.');
    p.http.expectNone('/api/dispensaciones');
  });

  it('un código pegado completa GTIN y serie', async () => {
    const p = iniciar();
    const pegado = p.raiz.querySelector('mc-campo-codigo input') as HTMLInputElement;

    pegado.value = '(01)07799000001010(21)L20260001S000001';
    pegado.dispatchEvent(new Event('change'));

    await p.esperar(() => {
      const gtin = Array.from(p.raiz.querySelectorAll('mat-form-field')).find((f) => f.querySelector('mat-label')?.textContent === 'GTIN')?.querySelector('input') as HTMLInputElement;
      expect(gtin.value).toBe('07799000001010');
    });
  });

  it('con obra social manda cobertura y afiliado; el DNI viaja a la API pero no queda en pantalla', async () => {
    const p = iniciar();
    escribir(p.raiz, 'GTIN', '07799000001010');
    escribir(p.raiz, 'Número de serie', 'S1');
    escribir(p.raiz, 'Número de receta', 'RX-1');
    escribir(p.raiz, 'DNI del paciente (opcional)', '30456006');
    escribir(p.raiz, 'Obra social o prepaga', 'OSEP');
    escribir(p.raiz, 'Número de afiliado', '100-55');

    enviar(p.raiz);
    const pedido = await vi.waitFor(() => p.http.expectOne('/api/dispensaciones'));
    expect(pedido.request.body).toEqual({ gtin: '07799000001010', serie: 'S1', particular: false, numeroReceta: 'RX-1', obraSocial: 'OSEP', numeroAfiliado: '100-55', dni: '30456006' });
    pedido.flush({ id: 'd1' }, { status: 201, statusText: 'Created' });

    await vi.waitFor(() => expect(p.http.match((r) => r.url === '/api/dispensaciones').length).toBe(1));
    const campos = Array.from(p.raiz.querySelectorAll('mc-formulario-dispensar input')).map((i) => (i as HTMLInputElement).value);
    expect(campos).not.toContain('30456006');
  });

  it('particular no manda obra social ni afiliado', async () => {
    const p = iniciar();
    escribir(p.raiz, 'GTIN', '07799000001010');
    escribir(p.raiz, 'Número de serie', 'S2');
    escribir(p.raiz, 'Número de receta', 'RX-2');
    (p.raiz.querySelector('mat-checkbox input') as HTMLInputElement).click();
    await p.esperar(() => expect(p.raiz.textContent).not.toContain('Número de afiliado'));

    enviar(p.raiz);
    const pedido = await vi.waitFor(() => p.http.expectOne('/api/dispensaciones'));
    expect(pedido.request.body).toEqual({ gtin: '07799000001010', serie: 'S2', particular: true, numeroReceta: 'RX-2' });
  });

  it.each([
    [409, 'La caja ya fue dispensada', 'R11'],
    [409, 'La caja figura como robada', 'R14'],
    [409, 'La caja está bloqueada', 'R10'],
    [404, 'La caja no está en tu stock', null],
  ])('un %i de la API (%s) se muestra tal cual arriba del formulario', async (status, mensaje, regla) => {
    const p = iniciar();
    escribir(p.raiz, 'GTIN', '07799000001010');
    escribir(p.raiz, 'Número de serie', 'S3');
    escribir(p.raiz, 'Número de receta', 'RX-3');
    (p.raiz.querySelector('mat-checkbox input') as HTMLInputElement).click();

    enviar(p.raiz);
    (await vi.waitFor(() => p.http.expectOne('/api/dispensaciones'))).flush(...errorApi(status, mensaje, regla));

    await p.esperar(() => expect(p.raiz.querySelector('mc-formulario-dispensar mc-error-api [role="alert"]')?.textContent).toContain(mensaje));
    if (regla !== null) {
      expect(p.raiz.querySelector('mc-formulario-dispensar .regla')?.textContent).toBe(regla);
    }
  });

  it('el historial muestra el DNI enmascarado y solo ofrece anular lo no anulado; anular manda el motivo', async () => {
    const p = crearPantalla(Dispensar, 'FARMACIA');
    p.responder('/api/dispensaciones', pagina([
      { id: 'd1', fechaHora: '2026-10-08T18:00:00Z', serie: 'S1', gtin: '07799000001010', particular: false, obraSocial: 'OSEP', numeroAfiliado: '100-55', numeroReceta: 'RX-1', dniEnmascarado: '*****006', anulada: false },
      { id: 'd2', fechaHora: '2026-10-08T17:00:00Z', serie: 'S2', gtin: '07799000001010', particular: true, numeroReceta: 'RX-2', anulada: true },
    ]));
    await p.esperar(() => expect(p.raiz.querySelectorAll('mc-historial-dispensaciones tbody tr').length).toBe(2));

    const filas = Array.from(p.raiz.querySelectorAll('mc-historial-dispensaciones tbody tr')).map((f) => f.textContent?.replace(/\s+/g, ' ') ?? '');
    expect(filas[0]).toContain('*****006');
    expect(filas[0]).toContain('OSEP');
    expect(filas[1]).toContain('Anulada');
    expect(filas[1]).toContain('Particular');
    expect(Array.from(p.raiz.querySelectorAll('mc-historial-dispensaciones tbody button')).length).toBe(1);

    boton(p.raiz, 'Anular').click();
    await enviarDialogo('Receta equivocada');
    const pedido = await vi.waitFor(() => p.http.expectOne('/api/dispensaciones/d1/anular'));
    expect(pedido.request.body).toEqual({ motivo: 'Receta equivocada' });
    pedido.flush(...errorApi(409, 'Pasaron más de 2 horas', 'R11'));
    await vi.waitFor(() => expect(document.querySelector('mc-dialogo-accion .regla')?.textContent).toBe('R11'));
  });
});
