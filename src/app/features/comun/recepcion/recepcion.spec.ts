import { PAGINA_VACIA, crearPantalla, errorApi, pagina } from '../../../../testing/entorno';
import { Recepcion } from './recepcion';

function iniciar(rol: 'DISTRIBUIDOR' | 'FARMACIA') {
  const p = crearPantalla(Recepcion, rol, { sesion: { empresaId: 'e1' } });
  p.responder('/api/viajes', PAGINA_VACIA);
  p.responder('/api/recepciones', PAGINA_VACIA);
  return p;
}

function escribir(raiz: HTMLElement, etiqueta: string, valor: string) {
  const campo = Array.from(raiz.querySelectorAll('mat-form-field')).find((f) => f.querySelector('mat-label')?.textContent?.startsWith(etiqueta))?.querySelector('input') as HTMLInputElement;
  campo.value = valor;
  campo.dispatchEvent(new Event('input'));
}

async function enviar(p: ReturnType<typeof iniciar>, codigo = 'bul-0003') {
  escribir(p.raiz, 'Código del bulto', codigo);
  escribir(p.raiz, 'Cajas contadas', '200');
  escribir(p.raiz, 'Temperatura de llegada', '4,5');
  (p.raiz.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));
}

describe('Recepcion', () => {
  it('el título cambia según el rol', async () => {
    const dist = iniciar('DISTRIBUIDOR');
    await dist.esperar(() => expect(dist.raiz.querySelector('h1')?.textContent).toBe('Recibir bultos'));
  });

  it('manda el código en mayúsculas, la temperatura con punto y el precinto; muestra el resultado que decidió el servidor', async () => {
    const p = iniciar('FARMACIA');
    await p.esperar(() => expect(p.raiz.querySelector('h1')?.textContent).toBe('Por recibir'));

    await enviar(p);
    const pedido = await vi.waitFor(() => p.http.expectOne('/api/recepciones'));
    expect(pedido.request.body).toEqual({ codigoBulto: 'BUL-0003', precintoIntacto: true, cantidadVerificada: 200, temperatura: 4.5 });
    pedido.flush({ id: 'r1', codigoBulto: 'BUL-0003', conforme: false, motivoRechazo: 'TEMPERATURA_FUERA_DE_RANGO', fechaHora: '2026-10-08T18:00:00Z', temperatura: 4.5, precintoIntacto: true, cantidadVerificada: 200 }, { status: 201, statusText: 'Created' });

    await p.esperar(() => expect(p.raiz.querySelector('.resultado')).not.toBeNull());
    expect(p.raiz.querySelector('.resultado mc-estado')?.textContent).toContain('Rechazada');
    expect(p.raiz.querySelector('.resultado')?.textContent).toContain('TEMPERATURA_FUERA_DE_RANGO');
    // Después de recibir recarga las actas.
    await vi.waitFor(() => expect(p.http.match((r) => r.url === '/api/recepciones').length).toBe(1));
  });

  it.each([
    [404, 'Bulto inexistente', 'BUL-9999', null],
    [409, 'El bulto ya fue recibido', 'BUL-0003', 'BULTO_DUPLICADO'],
  ])('un %i de la API se muestra tal cual arriba del formulario (%s)', async (status, mensaje, codigo, regla) => {
    const p = iniciar('FARMACIA');

    await enviar(p, codigo);
    (await vi.waitFor(() => p.http.expectOne('/api/recepciones'))).flush(...errorApi(status, mensaje, regla));

    await p.esperar(() => expect(p.raiz.querySelector('mc-formulario-recepcion mc-error-api [role="alert"]')?.textContent).toContain(mensaje));
    expect(p.raiz.querySelector('.resultado')).toBeNull();
  });

  it('sin completar pide código, cajas y temperatura', async () => {
    const p = iniciar('FARMACIA');
    (p.raiz.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));

    await p.esperar(() => expect(p.raiz.textContent).toContain('Escaneá o escribí el código del bulto.'));
    expect(p.raiz.textContent).toContain('Escribí cuántas cajas contaste.');
    p.http.expectNone('/api/recepciones');
  });

  it('muestra solo los viajes en tránsito que vienen hacia la empresa', async () => {
    const p = crearPantalla(Recepcion, 'FARMACIA', { sesion: { empresaId: 'f1' } });
    p.responder('/api/viajes', pagina([
      { id: 'v1', codigo: 'VJ-0005', tramo: 'DISTRIBUIDOR_A_FARMACIA', estado: 'EN_TRANSITO', origenId: 'd1', fechaEstimadaEntrega: '2026-10-09T18:00:00Z', bultoCodigos: ['BUL-0003'] },
      { id: 'v2', codigo: 'VJ-0006', tramo: 'DISTRIBUIDOR_A_FARMACIA', estado: 'FINALIZADO', origenId: 'd1', fechaEstimadaEntrega: '2026-10-08T18:00:00Z', bultoCodigos: ['BUL-0001'] },
    ]));
    p.responder('/api/recepciones', PAGINA_VACIA);
    await vi.waitFor(() => p.http.match((r) => r.url === '/api/empresas/d1').forEach((r) => r.flush({ id: 'd1', razonSocial: 'Distribuidora Pie de Monte' })));

    await p.esperar(() => expect(p.raiz.querySelector('mc-viajes-en-camino .viajes')).not.toBeNull());
    const texto = p.raiz.querySelector('mc-viajes-en-camino')?.textContent ?? '';
    expect(texto).toContain('VJ-0005');
    expect(texto).toContain('Distribuidora Pie de Monte');
    expect(texto).not.toContain('VJ-0006');
  });
});
