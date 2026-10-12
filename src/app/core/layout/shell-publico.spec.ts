import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ShellPublico } from './shell-publico';

describe('ShellPublico', () => {
  it('muestra la marca, el selector de tema y el contenido de la ruta', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ShellPublico);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(raiz.querySelector('.marca')?.textContent).toContain('MediChain');
    expect(raiz.querySelector('mc-selector-tema')).not.toBeNull();
    expect(raiz.querySelector('main router-outlet')).not.toBeNull();
  });
});
