import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ID_CONTENIDO, SaltarAlContenido } from './saltar-al-contenido';

@Component({
  imports: [SaltarAlContenido],
  template: `<mc-saltar-al-contenido /><nav><a href="/x">Uno</a></nav><main [id]="id" tabindex="-1">Contenido</main>`,
})
class Pagina {
  protected readonly id = ID_CONTENIDO;
}

describe('mc-saltar-al-contenido', () => {
  it('es el primer elemento enfocable y, al activarlo, mueve el foco al contenido sin navegar', async () => {
    const fixture = TestBed.createComponent(Pagina);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    document.body.appendChild(raiz);

    expect(raiz.querySelector('a')?.textContent).toBe('Saltar al contenido');
    const evento = new MouseEvent('click', { cancelable: true, bubbles: true });
    raiz.querySelector('mc-saltar-al-contenido a')?.dispatchEvent(evento);

    expect(evento.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(raiz.querySelector('main'));
    raiz.remove();
  });
});
