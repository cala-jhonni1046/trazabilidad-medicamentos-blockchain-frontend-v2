import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { guardarSesionDePrueba, sesionDePrueba } from '../../../testing/sesion-de-prueba';
import { proveerClienteApi } from '../api/api.providers';
import { ROL_USUARIO, RolUsuario } from '../api/modelos';
import { SesionService } from '../auth/sesion.service';
import { MENU_POR_ROL } from './navegacion';
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
    expect(raiz.querySelector('nav a')?.textContent).toContain('Bandeja');
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

  it.each([...ROL_USUARIO])('%s: en cada pantalla se resalta UNA sola entrada del menú, la de la ruta actual', async (rol) => {
    // Rutas reales del menú del rol (el inicio es prefijo de las demás: "/farmacia" y "/farmacia/stock").
    sessionStorage.clear();
    guardarSesionDePrueba(sesionDePrueba({ rol, empresaId: null, nombre: 'Paula Díaz' }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        proveerClienteApi(),
      ],
    });
    TestBed.inject(SesionService).restaurar();
    const fixture = TestBed.createComponent(ShellApp);
    const raiz = fixture.nativeElement as HTMLElement;
    const router = TestBed.inject(Router);

    for (const elemento of MENU_POR_ROL[rol]) {
      await router.navigateByUrl(elemento.ruta);
      await fixture.whenStable();

      const resaltadas = Array.from(raiz.querySelectorAll('nav a.activo')).map((enlace) => enlace.textContent?.trim());
      expect(resaltadas, `en ${elemento.ruta}`).toEqual([elemento.texto]);
      expect(raiz.querySelectorAll('nav a[aria-current="page"]').length, `aria-current en ${elemento.ruta}`).toBe(1);
    }
  });

  it('una pantalla dentro de una sección que no es el inicio sigue resaltando su entrada (coincidencia por prefijo)', async () => {
    sessionStorage.clear();
    guardarSesionDePrueba(sesionDePrueba({ rol: 'FARMACIA', empresaId: null, nombre: 'Paula Díaz' }));
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '**', children: [] }]), provideHttpClient(), provideHttpClientTesting(), proveerClienteApi()],
    });
    TestBed.inject(SesionService).restaurar();
    const fixture = TestBed.createComponent(ShellApp);

    await TestBed.inject(Router).navigateByUrl('/farmacia/stock/detalle-de-prueba');
    await fixture.whenStable();

    const resaltadas = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('nav a.activo'));
    expect(resaltadas.map((enlace) => enlace.textContent?.trim())).toEqual(['Stock']);
  });
});
