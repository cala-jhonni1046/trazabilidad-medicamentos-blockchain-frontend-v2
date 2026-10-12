import { TestBed } from '@angular/core/testing';
import { PRESENTACION_ESTADO_HABILITACION } from './catalogo-estados';
import { Estado } from './estado';

describe('mc-estado', () => {
  it('muestra ícono y texto, y la clase del tono', async () => {
    const fixture = TestBed.createComponent(Estado);
    fixture.componentRef.setInput('presentacion', PRESENTACION_ESTADO_HABILITACION.SUSPENDIDA);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(raiz.textContent).toContain('Suspendida');
    expect(raiz.querySelector('mc-icono mat-icon')).not.toBeNull();
    expect(raiz.classList.contains('tono-critico')).toBe(true);
  });
});
