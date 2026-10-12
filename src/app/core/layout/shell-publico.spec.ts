import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { guardarSesionDePrueba, sesionDePrueba } from '../../../testing/sesion-de-prueba';
import { proveerClienteApi } from '../api/api.providers';
import { SesionService } from '../auth/sesion.service';
import { ShellPublico } from './shell-publico';

describe('ShellPublico', () => {
  it('muestra la marca, el selector de tema y el contenido de la ruta', async () => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), proveerClienteApi()] });
    const fixture = TestBed.createComponent(ShellPublico);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(raiz.querySelector('.marca')?.textContent).toContain('MediChain');
    expect(raiz.querySelector('mc-selector-tema')).not.toBeNull();
    expect(raiz.querySelector('main router-outlet')).not.toBeNull();
  });

  it('sin sesión ofrece Ingresar; con sesión, volver a la cuenta', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), proveerClienteApi()] });
    const sinSesion = TestBed.createComponent(ShellPublico);
    await sinSesion.whenStable();
    const enlaces = (sinSesion.nativeElement as HTMLElement).querySelector('.enlaces')?.textContent;
    expect(enlaces).toContain('Verificar un medicamento');
    expect(enlaces).toContain('Ingresar');

    guardarSesionDePrueba(sesionDePrueba());
    TestBed.inject(SesionService).restaurar();
    const conSesion = TestBed.createComponent(ShellPublico);
    await conSesion.whenStable();
    const enlacesConSesion = (conSesion.nativeElement as HTMLElement).querySelector('.enlaces')?.textContent;
    expect(enlacesConSesion).toContain('Volver a mi cuenta');
    expect(enlacesConSesion).not.toContain('Ingresar');
    sessionStorage.clear();
  });
});
