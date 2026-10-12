import { TestBed } from '@angular/core/testing';
import { SelectorTema } from './selector-tema';
import { TemaService } from './tema.service';

/** Botones del selector, en orden. */
function botones(raiz: HTMLElement): HTMLButtonElement[] {
  return Array.from(raiz.querySelectorAll<HTMLButtonElement>('mat-button-toggle button'));
}

describe('SelectorTema', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('ofrece Claro, Oscuro y Sistema', async () => {
    const fixture = TestBed.createComponent(SelectorTema);
    await fixture.whenStable();

    const textos = botones(fixture.nativeElement as HTMLElement).map((boton) => boton.textContent?.trim());

    expect(textos).toEqual(['Claro', 'Oscuro', 'Sistema']);
  });

  it('elegir "Oscuro" cambia la preferencia y pone data-theme="dark"', async () => {
    const fixture = TestBed.createComponent(SelectorTema);
    await fixture.whenStable();

    botones(fixture.nativeElement as HTMLElement)[1].click();
    await fixture.whenStable();

    expect(TestBed.inject(TemaService).preferencia()).toBe('oscuro');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('el grupo tiene un nombre accesible', async () => {
    const fixture = TestBed.createComponent(SelectorTema);
    await fixture.whenStable();

    const grupo = (fixture.nativeElement as HTMLElement).querySelector('mat-button-toggle-group');

    expect(grupo?.getAttribute('aria-label')).toBe('Tema de colores');
  });
});
