import { TestBed } from '@angular/core/testing';
import { CamaraEscaner, DetectorCodigos } from './camara';
import { EscanerGs1, INTERVALO_LECTURA_MS } from './escaner-gs1';
import { CodigoLeido } from '../ui/campo-codigo';

/** Cámara falsa: un flujo con pistas que se pueden vigilar y un detector que devuelve lo que se le indique. */
function crearCamara(opciones: { disponible?: boolean; error?: DOMException; lecturas?: string[][] } = {}) {
  const pista = { stop: vi.fn() };
  const flujo = { getTracks: () => [pista] } as unknown as MediaStream;
  const lecturas = [...(opciones.lecturas ?? [])];
  const detector: DetectorCodigos = {
    detect: vi.fn(async () => (lecturas.shift() ?? []).map((rawValue) => ({ rawValue }))),
  };
  const camara = {
    disponible: () => opciones.disponible ?? true,
    abrirCamara: vi.fn(async () => {
      if (opciones.error !== undefined) {
        throw opciones.error;
      }
      return flujo;
    }),
    crearDetector: vi.fn(async () => detector),
  };
  return { camara, pista, detector };
}

async function crear(camara: object) {
  TestBed.configureTestingModule({ providers: [{ provide: CamaraEscaner, useValue: camara }] });
  // jsdom no implementa play(): se simula.
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  const fixture = TestBed.createComponent(EscanerGs1);
  const leidos: CodigoLeido[] = [];
  let cerrado = 0;
  fixture.componentInstance.leido.subscribe((c) => leidos.push(c));
  fixture.componentInstance.cerrado.subscribe(() => (cerrado += 1));
  fixture.detectChanges();
  await fixture.whenStable();
  return { fixture, raiz: fixture.nativeElement as HTMLElement, leidos, cerrado: () => cerrado };
}

describe('mc-escaner-gs1', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('un código de caja reconocido emite GTIN y serie, apaga la cámara y se cierra', async () => {
    const { camara, pista } = crearCamara({ lecturas: [['(01)07799000001010(21)L20260001S000001']] });
    const { raiz, leidos, cerrado } = await crear(camara);

    await vi.waitFor(() => expect(leidos).toEqual([{ gtin: '07799000001010', serie: 'L20260001S000001' }]));
    expect(pista.stop).toHaveBeenCalled();
    expect(cerrado()).toBe(1);
    expect(raiz).toBeTruthy();
  });

  it('un código que no es de una caja da una pista y sigue escaneando hasta encontrar uno bueno', async () => {
    const { camara, detector } = crearCamara({ lecturas: [['https://ejemplo.com'], ['0107799000001010']] });
    const { raiz, leidos } = await crear(camara);

    await vi.waitFor(() => expect(raiz.querySelector('.pista')?.textContent).toContain('no es el de una caja de medicamento'));
    // Sigue leyendo cuadros; el segundo código tampoco es reconocible, el tercer intento no trae nada.
    await vi.waitFor(() => expect((detector.detect as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(1), { timeout: INTERVALO_LECTURA_MS * 8 });
    expect(leidos).toEqual([]);
  });

  it.each([
    ['NotAllowedError', 'el permiso está denegado'],
    ['NotFoundError', 'No encontramos una cámara'],
    ['AbortError', 'No pudimos abrir la cámara'],
  ])('si la cámara falla con %s lo explica y permite escribir a mano', async (nombre, texto) => {
    const { camara } = crearCamara({ error: new DOMException('x', nombre) });
    const { raiz, leidos } = await crear(camara);

    await vi.waitFor(() => expect(raiz.querySelector('[role="alert"]')?.textContent).toContain(texto));
    expect(raiz.querySelector('[role="alert"]')?.textContent).toContain('a mano');
    expect(leidos).toEqual([]);
    expect(raiz.querySelector('video')).toBeNull();
  });

  it('un navegador sin cámara (o sin conexión segura) lo avisa sin intentar abrirla', async () => {
    const { camara } = crearCamara({ disponible: false });
    const { raiz } = await crear(camara);

    expect(raiz.querySelector('[role="alert"]')?.textContent).toContain('no permite usar la cámara');
    expect(camara.abrirCamara).not.toHaveBeenCalled();
  });

  it('"Cerrar la cámara" y destruir el componente apagan la cámara', async () => {
    const primera = crearCamara();
    const a = await crear(primera.camara);
    await vi.waitFor(() => expect(primera.camara.crearDetector).toHaveBeenCalled());
    (a.raiz.querySelector('button') as HTMLButtonElement).click();
    expect(primera.pista.stop).toHaveBeenCalled();
    expect(a.cerrado()).toBe(1);
    TestBed.resetTestingModule();

    const segunda = crearCamara();
    const b = await crear(segunda.camara);
    await vi.waitFor(() => expect(segunda.camara.crearDetector).toHaveBeenCalled());
    await vi.waitFor(() => expect(b.fixture.componentInstance).toBeTruthy());
    b.fixture.destroy();
    expect(segunda.pista.stop).toHaveBeenCalled();
  });

  it('si se cierra mientras la cámara todavía se está abriendo, la apaga igual', async () => {
    const pista = { stop: vi.fn() };
    let abrir: (flujo: MediaStream) => void = () => undefined;
    const camara = {
      disponible: () => true,
      abrirCamara: () => new Promise<MediaStream>((resolver) => (abrir = resolver)),
      crearDetector: async () => ({ detect: async () => [] }),
    };
    const { fixture } = await crear(camara);

    fixture.destroy();
    abrir({ getTracks: () => [pista] } as unknown as MediaStream);

    await vi.waitFor(() => expect(pista.stop).toHaveBeenCalled());
  });
});
