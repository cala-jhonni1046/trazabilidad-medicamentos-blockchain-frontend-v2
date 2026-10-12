import { TestBed } from '@angular/core/testing';
import { EstadoCarga, Mosaico } from './mosaico';

async function pintar(entradas: { valor?: number | null; estado?: EstadoCarga; tono?: 'atencion' | null }): Promise<HTMLElement> {
  const fixture = TestBed.createComponent(Mosaico);
  fixture.componentRef.setInput('etiqueta', 'Empresas');
  for (const [nombre, valor] of Object.entries(entradas)) {
    fixture.componentRef.setInput(nombre, valor);
  }
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('mc-mosaico', () => {
  it('muestra la etiqueta y el número con separador de miles', async () => {
    const raiz = await pintar({ valor: 12345 });

    expect(raiz.querySelector('.etiqueta')?.textContent).toBe('Empresas');
    expect(raiz.querySelector('.valor')?.textContent?.trim()).toBe('12.345');
  });

  it('el cero se muestra como 0 (no como vacío)', async () => {
    expect((await pintar({ valor: 0 })).querySelector('.valor')?.textContent?.trim()).toBe('0');
  });

  it('cargando: puntos suspensivos y aria-busy', async () => {
    const raiz = await pintar({ estado: 'cargando' });

    expect(raiz.querySelector('.valor')?.textContent?.trim()).toBe('…');
    expect(raiz.querySelector('.valor')?.getAttribute('aria-busy')).toBe('true');
  });

  it('error: raya y "no disponible" para lectores de pantalla', async () => {
    const raiz = await pintar({ estado: 'error', valor: 7 });

    expect(raiz.querySelector('.valor')?.textContent).toContain('—');
    expect(raiz.querySelector('.solo-lectores')?.textContent).toBe('no disponible');
  });

  it('el tono se aplica como clase del host', async () => {
    expect((await pintar({ valor: 3, tono: 'atencion' })).classList.contains('tono-atencion')).toBe(true);
  });
});
