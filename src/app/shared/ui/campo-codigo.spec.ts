import { TestBed } from '@angular/core/testing';
import { CamaraEscaner } from '../escaner/camara';
import { CampoCodigo, CodigoLeido } from './campo-codigo';

async function crear() {
  const fixture = TestBed.createComponent(CampoCodigo);
  const leidos: CodigoLeido[] = [];
  fixture.componentInstance.leido.subscribe((c) => leidos.push(c));
  await fixture.whenStable();
  const raiz = fixture.nativeElement as HTMLElement;
  const entrada = raiz.querySelector('input') as HTMLInputElement;
  const poner = async (texto: string) => {
    entrada.value = texto;
    entrada.dispatchEvent(new Event('change'));
    await fixture.whenStable();
  };
  return { raiz, entrada, leidos, poner };
}

describe('mc-campo-codigo', () => {
  it('un código GS1 emite GTIN y serie y limpia el campo', async () => {
    const { raiz, entrada, leidos, poner } = await crear();

    await poner('(01)07799000001010(21)L20260001S000001');

    expect(leidos).toEqual([{ gtin: '07799000001010', serie: 'L20260001S000001' }]);
    expect(entrada.value).toBe('');
    expect(raiz.querySelector('.aviso')?.textContent).toContain('Código leído');
  });

  it('"GTIN serie" también se reconoce', async () => {
    const { leidos, poner } = await crear();

    await poner('07799000001010 ABC123');

    expect(leidos).toEqual([{ gtin: '07799000001010', serie: 'ABC123' }]);
  });

  it('un texto que no es un código avisa y no emite nada', async () => {
    const { raiz, leidos, poner } = await crear();

    await poner('esto no es un código');

    expect(leidos).toEqual([]);
    expect(raiz.querySelector('.aviso.error')?.textContent).toContain('No pudimos leer este código');
  });

  it('vaciar el campo borra el aviso', async () => {
    const { raiz, poner } = await crear();
    await poner('basura');

    await poner('  ');

    expect(raiz.querySelector('.aviso')).toBeNull();
  });
});

describe('mc-campo-codigo con la cámara', () => {
  it('"Escanear con la cámara" abre el escáner y lo carga bajo demanda', async () => {
    const { raiz, fixture } = await crearConCamara();

    const boton = Array.from(raiz.querySelectorAll('button')).find((b) => b.textContent?.includes('Escanear con la cámara')) as HTMLButtonElement;
    boton.click();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(raiz.querySelector('mc-escaner-gs1')).not.toBeNull();
    });
    expect(Array.from(raiz.querySelectorAll('button')).some((b) => b.textContent?.includes('Escanear con la cámara'))).toBe(false);
  });
});

async function crearConCamara() {
  const camara = { disponible: () => false, abrirCamara: vi.fn(), crearDetector: vi.fn() };
  TestBed.configureTestingModule({ providers: [{ provide: CamaraEscaner, useValue: camara }] });
  const fixture = TestBed.createComponent(CampoCodigo);
  await fixture.whenStable();
  return { fixture, raiz: fixture.nativeElement as HTMLElement };
}
