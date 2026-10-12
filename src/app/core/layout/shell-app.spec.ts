import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { guardarSesionDePrueba, sesionDePrueba } from '../../../testing/sesion-de-prueba';
import { proveerClienteApi } from '../api/api.providers';
import { RolUsuario } from '../api/modelos';
import { SesionService } from '../auth/sesion.service';
import { ShellApp } from './shell-app';

/** Crea el marco con una sesión del rol dado. */
async function crear(rol: RolUsuario, empresaId: string | null) {
  sessionStorage.clear();
  guardarSesionDePrueba(sesionDePrueba({ rol, empresaId, nombre: 'Paula Díaz' }));
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), proveerClienteApi()],
  });
  TestBed.inject(SesionService).restaurar();
  const fixture = TestBed.createComponent(ShellApp);
  // Con empresa hay un pedido pendiente: whenStable() esperaría su respuesta, que llega después.
  if (empresaId === null) {
    await fixture.whenStable();
  } else {
    fixture.detectChanges();
  }
  return { fixture, raiz: fixture.nativeElement as HTMLElement, http: TestBed.inject(HttpTestingController) };
}

describe('ShellApp', () => {
  afterEach(() => sessionStorage.clear());

  it('muestra el rol, el nombre y el menú del rol; un rol sin empresa no pide nada a la API', async () => {
    const { raiz, http } = await crear('INSPECTOR', null);

    expect(raiz.querySelector('.rol')?.textContent).toContain('Inspector ANMAT');
    expect(raiz.querySelector('.nombre')?.textContent).toContain('Paula Díaz');
    expect(raiz.querySelector('nav a')?.textContent).toContain('Inicio');
    expect(raiz.querySelector('mc-aviso-empresa [role="status"]')).toBeNull();
    http.verify();
  });

  it('una empresa HABILITADA: muestra su nombre y ningún aviso', async () => {
    const { fixture, raiz, http } = await crear('FARMACIA', 'e1');

    http.expectOne('/api/empresas/e1').flush({ razonSocial: 'Farmacia Cerro Arco', estado: 'HABILITADA' });
    await fixture.whenStable();

    expect(raiz.querySelector('.detalle')?.textContent).toContain('Farmacia Cerro Arco');
    expect(raiz.querySelector('mc-aviso-empresa [role="status"]')).toBeNull();
  });

  it('una empresa SUSPENDIDA: avisa su estado y no bloquea nada (el contenido sigue ahí)', async () => {
    const { fixture, raiz, http } = await crear('FARMACIA', 'e1');

    http.expectOne('/api/empresas/e1').flush({ razonSocial: 'Farmacia Cerro Arco', estado: 'SUSPENDIDA' });
    await fixture.whenStable();

    expect(raiz.querySelector('mc-aviso-empresa [role="status"]')?.textContent).toContain('suspendida');
    expect(raiz.querySelector('router-outlet')).not.toBeNull();
    expect(raiz.querySelector('nav a')).not.toBeNull();
  });

  it('"Salir" cierra la sesión y lleva a ingresar', async () => {
    const { raiz } = await crear('FARMACIA', null);
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    (raiz.querySelector('.salir') as HTMLButtonElement).click();

    expect(TestBed.inject(SesionService).sesion()).toBeNull();
    expect(navegar).toHaveBeenCalledWith(['/ingresar'], { queryParams: {} });
  });
});
