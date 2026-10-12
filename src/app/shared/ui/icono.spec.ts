import { TestBed } from '@angular/core/testing';
import { Icono } from './icono';
import { ICONOS, NombreIcono } from './iconos';

describe('mc-icono', () => {
  it.each(Object.keys(ICONOS) as NombreIcono[])('dibuja el SVG de "%s"', async (nombre) => {
    const fixture = TestBed.createComponent(Icono);
    fixture.componentRef.setInput('nombre', nombre);
    await fixture.whenStable();

    const svg = (fixture.nativeElement as HTMLElement).querySelector('mat-icon svg');
    expect(svg).not.toBeNull();
    expect(svg?.querySelector('path')).not.toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('mat-icon')?.getAttribute('aria-hidden')).toBe('true');
  });
});
