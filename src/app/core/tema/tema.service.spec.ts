import { TestBed } from '@angular/core/testing';
import { CLAVE_PREFERENCIA_TEMA, TemaService, esPreferenciaTema } from './tema.service';

/**
 * MediaQueryList falso para simular el modo del sistema operativo
 * (jsdom no implementa matchMedia).
 */
class ConsultaSistemaFalsa {
  private readonly oyentes: ((evento: MediaQueryListEvent) => void)[] = [];

  constructor(public matches: boolean) {}

  addEventListener(_tipo: 'change', oyente: (evento: MediaQueryListEvent) => void): void {
    this.oyentes.push(oyente);
  }

  /** Simula que la persona cambia el modo de su sistema operativo. */
  cambiarSistema(oscuro: boolean): void {
    this.matches = oscuro;
    for (const oyente of this.oyentes) {
      oyente({ matches: oscuro } as MediaQueryListEvent);
    }
  }
}

/** Ventana de jsdom (la misma que usa el servicio a través de DOCUMENT). */
const ventana = document.defaultView as Window;

/** Instala un matchMedia falso que siempre devuelve la consulta dada. */
function simularSistema(consulta: ConsultaSistemaFalsa): void {
  Object.defineProperty(ventana, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (): MediaQueryList => consulta as unknown as MediaQueryList,
  });
}

/** Atributo data-theme actual de <html>. */
function atributoTema(): string | null {
  return document.documentElement.getAttribute('data-theme');
}

describe('TemaService', () => {
  beforeEach(() => {
    ventana.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(ventana, 'matchMedia');
    ventana.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('sin preferencia guardada usa "sistema" y no pone data-theme', () => {
    const tema = TestBed.inject(TemaService);

    tema.iniciar();

    expect(tema.preferencia()).toBe('sistema');
    expect(atributoTema()).toBeNull();
  });

  it('"oscuro" pone data-theme="dark" y lo guarda', () => {
    const tema = TestBed.inject(TemaService);
    tema.iniciar();

    tema.cambiarPreferencia('oscuro');

    expect(atributoTema()).toBe('dark');
    expect(tema.modo()).toBe('oscuro');
    expect(ventana.localStorage.getItem(CLAVE_PREFERENCIA_TEMA)).toBe('oscuro');
  });

  it('"claro" pone data-theme="light" y "sistema" lo quita', () => {
    const tema = TestBed.inject(TemaService);
    tema.iniciar();

    tema.cambiarPreferencia('claro');
    expect(atributoTema()).toBe('light');

    tema.cambiarPreferencia('sistema');
    expect(atributoTema()).toBeNull();
    expect(ventana.localStorage.getItem(CLAVE_PREFERENCIA_TEMA)).toBe('sistema');
  });

  it('al iniciar aplica la preferencia guardada', () => {
    ventana.localStorage.setItem(CLAVE_PREFERENCIA_TEMA, 'oscuro');
    const tema = TestBed.inject(TemaService);

    tema.iniciar();

    expect(tema.preferencia()).toBe('oscuro');
    expect(atributoTema()).toBe('dark');
  });

  it('un valor guardado inválido se ignora y queda "sistema"', () => {
    ventana.localStorage.setItem(CLAVE_PREFERENCIA_TEMA, 'violeta');
    const tema = TestBed.inject(TemaService);

    tema.iniciar();

    expect(tema.preferencia()).toBe('sistema');
    expect(atributoTema()).toBeNull();
  });

  it('si el almacenamiento está bloqueado, el tema funciona igual durante la sesión', () => {
    vi.spyOn(ventana.localStorage, 'getItem').mockImplementation(() => {
      throw new DOMException('Almacenamiento bloqueado', 'SecurityError');
    });
    vi.spyOn(ventana.localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('Almacenamiento bloqueado', 'SecurityError');
    });
    const tema = TestBed.inject(TemaService);
    tema.iniciar();

    expect(tema.preferencia()).toBe('sistema');
    expect(() => tema.cambiarPreferencia('oscuro')).not.toThrow();
    expect(atributoTema()).toBe('dark');
  });

  it('con "sistema", el modo sigue al sistema operativo en vivo', () => {
    const consulta = new ConsultaSistemaFalsa(true);
    simularSistema(consulta);
    const tema = TestBed.inject(TemaService);
    tema.iniciar();

    expect(tema.modo()).toBe('oscuro');

    consulta.cambiarSistema(false);
    expect(tema.modo()).toBe('claro');
  });

  it('una preferencia elegida manda sobre el sistema', () => {
    simularSistema(new ConsultaSistemaFalsa(true));
    const tema = TestBed.inject(TemaService);
    tema.iniciar();

    tema.cambiarPreferencia('claro');

    expect(tema.modo()).toBe('claro');
  });

  it('sin matchMedia (entorno sin soporte), "sistema" se ve claro', () => {
    const tema = TestBed.inject(TemaService);
    tema.iniciar();

    expect(typeof ventana.matchMedia).not.toBe('function');
    expect(tema.modo()).toBe('claro');
  });
});

describe('esPreferenciaTema', () => {
  it('acepta solo claro, oscuro y sistema', () => {
    expect(esPreferenciaTema('claro')).toBe(true);
    expect(esPreferenciaTema('oscuro')).toBe(true);
    expect(esPreferenciaTema('sistema')).toBe(true);
    expect(esPreferenciaTema('dark')).toBe(false);
    expect(esPreferenciaTema(null)).toBe(false);
    expect(esPreferenciaTema(1)).toBe(false);
  });
});
