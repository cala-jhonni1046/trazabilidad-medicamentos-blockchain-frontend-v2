import { TestBed } from '@angular/core/testing';
import { Muestrario } from './muestrario';

describe('Muestrario', () => {
  it('muestra los colores base, los seis tonos y el selector de tema', async () => {
    const fixture = TestBed.createComponent(Muestrario);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(raiz.querySelectorAll('.color').length).toBe(12);
    expect(Array.from(raiz.querySelectorAll('.tono .etiqueta')).map((e) => e.textContent?.trim())).toEqual([
      'Correcto',
      'Atención',
      'Crítico',
      'En tránsito',
      'Blockchain',
      'Neutro',
    ]);
    expect(raiz.querySelector('mc-selector-tema')).not.toBeNull();
  });
});
