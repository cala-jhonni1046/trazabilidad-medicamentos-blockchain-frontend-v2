import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { proveerFocoEnNavegacion } from './foco-navegacion';

@Component({ template: `<main><h1>Pantalla A</h1></main>` })
class A {}
@Component({ template: `<main><h1>Pantalla B</h1></main>` })
class B {}
@Component({ template: `<main id="contenido"><p>Sin título</p></main>` })
class SinTitulo {}

describe('foco al navegar', () => {
  async function iniciar() {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'a', component: A }, { path: 'b', component: B }, { path: 'c', component: SinTitulo }]), proveerFocoEnNavegacion()],
    });
    // TestBed ya monta el componente raíz dentro del documento, así puede tener foco.
    return RouterTestingHarness.create();
  }

  it('la primera navegación no mueve el foco; las siguientes lo llevan al título', async () => {
    const harness = await iniciar();

    await harness.navigateByUrl('/a');
    await new Promise((r) => setTimeout(r, 20));
    expect(document.activeElement?.tagName).not.toBe('H1');

    await harness.navigateByUrl('/b');
    await vi.waitFor(() => expect(document.activeElement?.tagName).toBe('H1'));
    expect(document.activeElement?.textContent).toBe('Pantalla B');
    expect(TestBed.inject(Router).url).toBe('/b');
  });

  it('sin título, el foco va al contenido', async () => {
    const harness = await iniciar();
    await harness.navigateByUrl('/a');

    await harness.navigateByUrl('/c');

    await vi.waitFor(() => expect(document.activeElement?.id).toBe('contenido'));
  });
});
