import { TestBed } from '@angular/core/testing';
import { GraficoTemperatura, LecturaTemperatura } from './grafico-temperatura';

async function pintar(lecturas: LecturaTemperatura[]): Promise<HTMLElement> {
  const fixture = TestBed.createComponent(GraficoTemperatura);
  fixture.componentRef.setInput('lecturas', lecturas);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('mc-grafico-temperatura', () => {
  it('sin lecturas dice que no hay', async () => {
    expect((await pintar([])).textContent).toContain('Todavía no hay lecturas de temperatura.');
  });

  it('dibuja un punto por lectura; los fuera de rango van con otra forma y se resumen para lectores de pantalla', async () => {
    const raiz = await pintar([
      { fechaHora: '2026-10-08T12:00:00Z', temperatura: 4.5, fueraDeRango: false },
      { fechaHora: '2026-10-08T12:10:00Z', temperatura: 5, fueraDeRango: false },
      { fechaHora: '2026-10-08T12:20:00Z', temperatura: 35, fueraDeRango: true },
    ]);

    expect(raiz.querySelectorAll('circle.punto').length).toBe(2);
    expect(raiz.querySelectorAll('rect.punto.fuera').length).toBe(1);
    expect(raiz.querySelector('svg')?.getAttribute('aria-label')).toBe('Temperatura del viaje: 3 lecturas entre 4.5 y 35 grados; 1 fuera de rango.');
  });

  it('la tabla desplegable trae todas las lecturas en hora de Argentina y su rango', async () => {
    const raiz = await pintar([{ fechaHora: '2026-10-08T18:00:00Z', temperatura: 6, fueraDeRango: true }]);

    const fila = raiz.querySelector('tbody tr')?.textContent?.replace(/\s+/g, ' ');
    expect(fila).toContain('08/10/2026 15:00');
    expect(fila).toContain('6 °C');
    expect(fila).toContain('Fuera de rango');
  });

  it('una sola lectura no rompe el gráfico', async () => {
    const raiz = await pintar([{ fechaHora: '2026-10-08T18:00:00Z', temperatura: 5, fueraDeRango: false }]);

    expect(raiz.querySelectorAll('circle.punto').length).toBe(1);
  });
});
