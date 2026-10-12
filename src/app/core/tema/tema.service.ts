import { DOCUMENT, Injectable, Signal, computed, inject, signal } from '@angular/core';

/** Tema que elige la persona: claro, oscuro o el de su sistema operativo. */
export type PreferenciaTema = 'claro' | 'oscuro' | 'sistema';

/** Modo que se ve en pantalla (la preferencia "sistema" ya resuelta). */
export type ModoTema = 'claro' | 'oscuro';

/** Las tres preferencias posibles, en el orden en que se ofrecen. */
export const PREFERENCIAS_TEMA: readonly PreferenciaTema[] = ['claro', 'oscuro', 'sistema'];

/** Clave de localStorage donde se guarda la preferencia (comodidad de cada navegador). */
export const CLAVE_PREFERENCIA_TEMA = 'mc.tema';

/** Consulta de medios que indica si el sistema operativo está en modo oscuro. */
const CONSULTA_SISTEMA_OSCURO = '(prefers-color-scheme: dark)';

/** Valor del atributo data-theme de <html> para cada preferencia (los selectores de _tokens.scss). */
const ATRIBUTO_POR_PREFERENCIA: Record<PreferenciaTema, 'light' | 'dark' | null> = {
  claro: 'light',
  oscuro: 'dark',
  sistema: null,
};

/**
 * Tema de colores de la aplicación.
 *
 * Los colores viven en los tokens CSS (src/styles/_tokens.scss); este servicio solo
 * pone o quita el atributo `data-theme` en `<html>`:
 * - claro → `data-theme="light"`
 * - oscuro → `data-theme="dark"`
 * - sistema → sin atributo (decide `prefers-color-scheme`)
 *
 * La preferencia se guarda en localStorage. Si el navegador no deja guardar
 * (modo privado, almacenamiento bloqueado), el tema funciona igual durante la sesión.
 */
@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly documento = inject(DOCUMENT);
  private readonly preferenciaElegida = signal<PreferenciaTema>(this.leerPreferenciaGuardada());
  private readonly sistemaEnOscuro = signal<boolean>(false);

  /** Preferencia actual (claro, oscuro o sistema). */
  readonly preferencia: Signal<PreferenciaTema> = this.preferenciaElegida.asReadonly();

  /** Modo que se ve en pantalla; con "sistema", sigue al sistema operativo en vivo. */
  readonly modo: Signal<ModoTema> = computed<ModoTema>(() => {
    const preferencia = this.preferenciaElegida();
    if (preferencia === 'sistema') {
      return this.sistemaEnOscuro() ? 'oscuro' : 'claro';
    }
    return preferencia;
  });

  /**
   * Aplica la preferencia guardada y empieza a seguir el modo del sistema.
   * Se llama una vez, al arrancar la aplicación (ver proveerTema).
   */
  iniciar(): void {
    const consulta = this.consultaSistemaOscuro();
    if (consulta !== null) {
      this.sistemaEnOscuro.set(consulta.matches);
      consulta.addEventListener('change', (evento: MediaQueryListEvent) => this.sistemaEnOscuro.set(evento.matches));
    }
    this.aplicarAtributo(this.preferenciaElegida());
  }

  /** Cambia la preferencia: la aplica en pantalla y la guarda. */
  cambiarPreferencia(preferencia: PreferenciaTema): void {
    this.preferenciaElegida.set(preferencia);
    this.aplicarAtributo(preferencia);
    this.guardarPreferencia(preferencia);
  }

  /** Pone o quita data-theme en <html> según la preferencia. */
  private aplicarAtributo(preferencia: PreferenciaTema): void {
    const raiz = this.documento.documentElement;
    const valor = ATRIBUTO_POR_PREFERENCIA[preferencia];
    if (valor === null) {
      raiz.removeAttribute('data-theme');
    } else {
      raiz.setAttribute('data-theme', valor);
    }
  }

  /** Lee la preferencia guardada; si no hay, es inválida o no se puede leer, usa "sistema". */
  private leerPreferenciaGuardada(): PreferenciaTema {
    try {
      const guardada = this.documento.defaultView?.localStorage.getItem(CLAVE_PREFERENCIA_TEMA) ?? null;
      return esPreferenciaTema(guardada) ? guardada : 'sistema';
    } catch {
      return 'sistema';
    }
  }

  /** Guarda la preferencia; si el navegador no lo permite, se ignora (solo dura la sesión). */
  private guardarPreferencia(preferencia: PreferenciaTema): void {
    try {
      this.documento.defaultView?.localStorage.setItem(CLAVE_PREFERENCIA_TEMA, preferencia);
    } catch {
      // Almacenamiento bloqueado: el tema elegido sigue aplicado hasta recargar.
    }
  }

  /** La consulta prefers-color-scheme, o null si el entorno no la soporta. */
  private consultaSistemaOscuro(): MediaQueryList | null {
    const ventana = this.documento.defaultView;
    if (ventana === null || typeof ventana.matchMedia !== 'function') {
      return null;
    }
    return ventana.matchMedia(CONSULTA_SISTEMA_OSCURO);
  }
}

/** Indica si un valor cualquiera es una de las tres preferencias válidas. */
export function esPreferenciaTema(valor: unknown): valor is PreferenciaTema {
  return typeof valor === 'string' && (PREFERENCIAS_TEMA as readonly string[]).includes(valor);
}
