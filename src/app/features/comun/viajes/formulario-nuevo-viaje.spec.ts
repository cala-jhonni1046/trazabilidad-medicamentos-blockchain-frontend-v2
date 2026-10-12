import { PAGINA_VACIA, crearPantalla, errorApi, pagina } from '../../../../testing/entorno';
import { FormularioNuevoViaje } from './formulario-nuevo-viaje';

const bulto = (id: string, codigo: string, cambios: object = {}) => ({ id, codigo, cantidad: 100, destinoId: 'f1', estado: 'ARMADO', viajeActualId: null, ...cambios });

function escribir(raiz: HTMLElement, etiqueta: string, valor: string) {
  const campo = Array.from(raiz.querySelectorAll('mat-form-field')).find((f) => f.querySelector('mat-label')?.textContent?.startsWith(etiqueta))?.querySelector('input') as HTMLInputElement;
  campo.value = valor;
  campo.dispatchEvent(new Event('input'));
}

describe('FormularioNuevoViaje', () => {
  it('pide los bultos del estado correcto según el rol: ARMADO para el laboratorio, EN_DEPOSITO para la distribuidora', async () => {
    const lab = crearPantalla(FormularioNuevoViaje, 'LABORATORIO', { entradas: { estadoBultos: 'ARMADO' } });
    await vi.waitFor(() => expect(lab.http.match((r) => r.url === '/api/bultos' && r.params.get('estado') === 'ARMADO').length).toBe(1));
  });

  it('sin bultos para despachar lo dice y no muestra el formulario', async () => {
    const p = crearPantalla(FormularioNuevoViaje, 'DISTRIBUIDOR', { entradas: { estadoBultos: 'EN_DEPOSITO' } });
    await vi.waitFor(() => p.responder('/api/bultos', PAGINA_VACIA));

    await p.esperar(() => expect(p.raiz.textContent).toContain('No hay bultos en tu depósito para despachar.'));
    expect(p.raiz.querySelector('form')).toBeNull();
  });

  it('no ofrece bultos que ya tienen viaje', async () => {
    const p = crearPantalla(FormularioNuevoViaje, 'LABORATORIO', { entradas: { estadoBultos: 'ARMADO' } });
    await vi.waitFor(() => p.responder('/api/bultos', pagina([bulto('b1', 'BUL-0001'), bulto('b2', 'BUL-0002', { viajeActualId: 'v9' })])));
    await vi.waitFor(() => p.http.match((r) => r.url === '/api/empresas/f1').forEach((r) => r.flush({ id: 'f1', razonSocial: 'Farmacia Sur' })));

    await p.esperar(() => expect(p.raiz.querySelector('form')).not.toBeNull());
    expect(p.raiz.querySelectorAll('mat-checkbox').length).toBe(1);
    expect(p.raiz.textContent).toContain('BUL-0001');
    expect(p.raiz.textContent).not.toContain('BUL-0002');
  });

  it('sin elegir bultos avisa y no llama a la API', async () => {
    const p = crearPantalla(FormularioNuevoViaje, 'LABORATORIO', { entradas: { estadoBultos: 'ARMADO' } });
    await vi.waitFor(() => p.responder('/api/bultos', pagina([bulto('b1', 'BUL-0001')])));
    await vi.waitFor(() => p.http.match((r) => r.url === '/api/empresas/f1').forEach((r) => r.flush({ id: 'f1', razonSocial: 'Farmacia Sur' })));
    await p.esperar(() => expect(p.raiz.querySelector('form')).not.toBeNull());

    escribir(p.raiz, 'Patente', 'AB123CD');
    escribir(p.raiz, 'Chofer', 'Juan');
    escribir(p.raiz, 'Entrega estimada', '2026-12-01T15:00');
    (p.raiz.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));

    await p.esperar(() => expect(p.raiz.textContent).toContain('Elegí al menos un bulto.'));
    p.http.expectNone('/api/viajes');
  });

  it('crea el viaje mandando los códigos de los bultos y la fecha con offset de Argentina', async () => {
    const p = crearPantalla(FormularioNuevoViaje, 'LABORATORIO', { entradas: { estadoBultos: 'ARMADO' } });
    await vi.waitFor(() => p.responder('/api/bultos', pagina([bulto('b1', 'BUL-0001')])));
    await vi.waitFor(() => p.http.match((r) => r.url === '/api/empresas/f1').forEach((r) => r.flush({ id: 'f1', razonSocial: 'Farmacia Sur' })));
    await p.esperar(() => expect(p.raiz.querySelector('form')).not.toBeNull());

    (p.raiz.querySelector('mat-checkbox input') as HTMLInputElement).click();
    escribir(p.raiz, 'Patente', ' AB123CD ');
    escribir(p.raiz, 'Chofer', 'Juan Camión');
    escribir(p.raiz, 'Entrega estimada', '2026-12-01T15:00');
    (p.raiz.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));

    const pedido = await vi.waitFor(() => p.http.expectOne('/api/viajes'));
    expect(pedido.request.body).toEqual({ bultos: ['BUL-0001'], patente: 'AB123CD', chofer: 'Juan Camión', fechaEstimadaEntrega: '2026-12-01T15:00:00-03:00' });
    pedido.flush(...errorApi(409, 'Los bultos van a distribuidoras distintas', 'R7'));

    await vi.waitFor(() => expect(p.raiz.querySelector('mc-error-api [role="alert"]')?.textContent).toContain('distribuidoras distintas'));
    expect(p.raiz.querySelector('.regla')?.textContent).toBe('R7');
  });
});
