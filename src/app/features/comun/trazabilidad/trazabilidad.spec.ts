import { crearPantalla, errorApi, limpiarOverlays } from '../../../../testing/entorno';
import { Trazabilidad } from './trazabilidad';

const evento = (numero: number, tipo: string, entidadTipo = 'Lote', cambios: object = {}) => ({
  id: `ev${numero}`, numero, tipo, entidadTipo, entidadId: 'x1', fechaHora: '2026-10-08T15:00:00Z', hash: `${'ab'.repeat(32)}`, hashAnterior: 'cd'.repeat(32),
  actorUsuarioId: 'u-secreto', actorEmpresaId: 'e-secreta', datosJson: '{"dni":"30111006","obraSocial":"OSEP"}', ...cambios,
});

const resultado = (cambios: object = {}) => ({
  tipo: 'LOTE', codigo: 'L2026-0001', entidadId: 'lo1', loteCodigo: 'L2026-0001', medicamentoNombre: 'Cuyafen',
  laboratorioRazonSocial: 'Laboratorio Andino Cuyano S.A.', truncado: false,
  eventos: [evento(18, 'LOTE_REGISTRADO'), evento(19, 'LOTE_LIBERADO')], ...cambios,
});

function escribir(raiz: HTMLElement, etiqueta: string, valor: string) {
  const campo = Array.from(raiz.querySelectorAll('mat-form-field'))
    .find((f) => f.querySelector('mat-label')?.textContent?.startsWith(etiqueta))
    ?.querySelector('input') as HTMLInputElement;
  campo.value = valor;
  campo.dispatchEvent(new Event('input'));
}

function elegir(raiz: HTMLElement, texto: string) {
  const radio = Array.from(raiz.querySelectorAll('label')).find((l) => l.textContent?.includes(texto))?.querySelector('input') as HTMLInputElement;
  radio.click();
}

function enviar(raiz: HTMLElement) {
  (raiz.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));
}

const RUTA = '/api/eventos-trazabilidad/recorrido';

describe('Trazabilidad', () => {
  afterEach(limpiarOverlays);

  it('por defecto busca una caja: manda gtin y serie (y nada más) y muestra los eventos en orden, con su texto y su hash', async () => {
    const p = crearPantalla(Trazabilidad, 'LABORATORIO');
    escribir(p.raiz, 'GTIN', ' 07799000001010 ');
    escribir(p.raiz, 'Número de serie', 'L20260001S000001');
    enviar(p.raiz);

    const pedido = await vi.waitFor(() => p.http.expectOne((r) => r.url === RUTA));
    expect(pedido.request.params.keys().sort()).toEqual(['gtin', 'serie']);
    expect(pedido.request.params.get('gtin')).toBe('07799000001010');
    pedido.flush({
      resultados: [resultado({ tipo: 'CAJA', codigo: 'L20260001S000001', eventos: [evento(18, 'LOTE_REGISTRADO'), evento(24, 'BULTO_ARMADO', 'Bulto'), evento(27, 'VIAJE_SALIDA', 'DespachoLogistico')] })],
    });

    await p.esperar(() => expect(p.raiz.querySelectorAll('.linea li').length).toBe(3));
    const filas = Array.from(p.raiz.querySelectorAll('.linea li')).map((li) => li.textContent ?? '');
    expect(filas[0]).toContain('#18');
    expect(filas[0]).toContain('Lote registrado');
    expect(filas[1]).toContain('Bulto armado');
    expect(filas[1]).toContain('Bulto');
    expect(filas[2]).toContain('Salida del camión');
    expect(filas[2]).toContain('Viaje');
    expect(filas[2]).toContain('08/10/2026 12:00');
    expect(p.raiz.querySelector('mc-hash code')?.getAttribute('title')).toBe('ab'.repeat(32));
    expect(p.raiz.textContent).toContain('Caja');
    expect(p.raiz.textContent).toContain('Cuyafen');
    expect(p.raiz.textContent).toContain('Laboratorio Andino Cuyano S.A.');
  });

  it('R13: no muestra datosJson ni los ids de actor aunque la respuesta los traiga', async () => {
    const p = crearPantalla(Trazabilidad, 'FARMACIA');
    escribir(p.raiz, 'GTIN', '07799000001010');
    escribir(p.raiz, 'Número de serie', 'L20260001S000001');
    enviar(p.raiz);
    (await vi.waitFor(() => p.http.expectOne((r) => r.url === RUTA))).flush({ resultados: [resultado({ eventos: [evento(1, 'DISPENSACION', 'Dispensacion')] })] });

    await p.esperar(() => expect(p.raiz.querySelector('.linea li')).not.toBeNull());
    const texto = p.raiz.textContent ?? '';
    expect(texto).toContain('Dispensación');
    expect(texto).not.toContain('30111006');
    expect(texto).not.toContain('OSEP');
    expect(texto).not.toContain('u-secreto');
    expect(texto).not.toContain('e-secreta');
  });

  it('buscar un bulto manda solo ?bulto= y un lote, solo ?lote=', async () => {
    const p = crearPantalla(Trazabilidad, 'LABORATORIO');

    elegir(p.raiz, 'Un bulto');
    await p.esperar(() => expect(p.raiz.textContent).toContain('Código del bulto'));
    escribir(p.raiz, 'Código del bulto', ' BUL-0001 ');
    enviar(p.raiz);
    const pedidoBulto = await vi.waitFor(() => p.http.expectOne((r) => r.url === RUTA));
    expect(pedidoBulto.request.params.keys()).toEqual(['bulto']);
    expect(pedidoBulto.request.params.get('bulto')).toBe('BUL-0001');
    pedidoBulto.flush({ resultados: [resultado({ tipo: 'BULTO', codigo: 'BUL-0001' })] });
    await p.esperar(() => expect(p.raiz.textContent).toContain('Bulto'));

    elegir(p.raiz, 'Un lote');
    await p.esperar(() => expect(p.raiz.querySelector('.linea')).toBeNull());
    escribir(p.raiz, 'Código del lote', 'L2026-0001');
    enviar(p.raiz);
    const pedidoLote = await vi.waitFor(() => p.http.expectOne((r) => r.url === RUTA));
    expect(pedidoLote.request.params.keys()).toEqual(['lote']);
    expect(pedidoLote.request.params.get('lote')).toBe('L2026-0001');
  });

  it('sin completar lo que se busca pide el dato y no llama a la API (solo se exige lo del modo elegido)', async () => {
    const p = crearPantalla(Trazabilidad, 'INSPECTOR');
    enviar(p.raiz);
    await p.esperar(() => {
      expect(p.raiz.textContent).toContain('Escribí el GTIN de la caja.');
      expect(p.raiz.textContent).toContain('Escribí el número de serie de la caja.');
    });
    expect(p.raiz.textContent).not.toContain('Escribí el código del bulto.');

    elegir(p.raiz, 'Un lote');
    await p.esperar(() => expect(p.raiz.textContent).toContain('Código del lote'));
    enviar(p.raiz);
    await p.esperar(() => expect(p.raiz.textContent).toContain('Escribí el código del lote.'));
    p.http.expectNone((r) => r.url === RUTA);
  });

  it('lo que la API responde 404 (lo ajeno, o lo que no existe) se muestra con su mensaje, sin resultados', async () => {
    const p = crearPantalla(Trazabilidad, 'FARMACIA');
    elegir(p.raiz, 'Un lote');
    await p.esperar(() => expect(p.raiz.textContent).toContain('Código del lote'));
    escribir(p.raiz, 'Código del lote', 'L2026-0001');
    enviar(p.raiz);

    (await vi.waitFor(() => p.http.expectOne((r) => r.url === RUTA))).flush(...errorApi(404, 'No hay un lote, bulto o caja con ese código que puedas ver'));

    await p.esperar(() => expect(p.raiz.querySelector('mc-error-api [role="alert"]')?.textContent).toContain('que puedas ver'));
    expect(p.raiz.querySelector('mc-resultado-recorrido')).toBeNull();
  });

  it('un código de lote repetido entre laboratorios muestra todos los resultados, cada uno con su laboratorio', async () => {
    const p = crearPantalla(Trazabilidad, 'SEDE_CENTRAL');
    elegir(p.raiz, 'Un lote');
    await p.esperar(() => expect(p.raiz.textContent).toContain('Código del lote'));
    escribir(p.raiz, 'Código del lote', 'L2026-0001');
    enviar(p.raiz);

    (await vi.waitFor(() => p.http.expectOne((r) => r.url === RUTA))).flush({
      resultados: [
        resultado({ entidadId: 'lo1', laboratorioRazonSocial: 'Laboratorio Andino Cuyano S.A.' }),
        resultado({ entidadId: 'lo2', laboratorioRazonSocial: 'Laboratorios del Norte S.A.' }),
      ],
    });

    await p.esperar(() => expect(p.raiz.querySelectorAll('mc-resultado-recorrido').length).toBe(2));
    expect(p.raiz.querySelector('#titulo-resultado')?.textContent).toContain('2 resultados');
    expect(p.raiz.textContent).toContain('Laboratorio Andino Cuyano S.A.');
    expect(p.raiz.textContent).toContain('Laboratorios del Norte S.A.');
  });

  it('avisa cuando hay más eventos de los que se devuelven', async () => {
    const p = crearPantalla(Trazabilidad, 'SEDE_CENTRAL');
    elegir(p.raiz, 'Un bulto');
    await p.esperar(() => expect(p.raiz.textContent).toContain('Código del bulto'));
    escribir(p.raiz, 'Código del bulto', 'BUL-0001');
    enviar(p.raiz);

    (await vi.waitFor(() => p.http.expectOne((r) => r.url === RUTA))).flush({ resultados: [resultado({ tipo: 'BULTO', truncado: true })] });

    await p.esperar(() => expect(p.raiz.querySelector('.aviso')?.textContent).toContain('más eventos'));
  });
});
