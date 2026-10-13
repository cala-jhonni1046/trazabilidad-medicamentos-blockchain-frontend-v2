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
  // Con empresa (o siendo inspector, que pide sus pendientes) hay un pedido en vuelo: whenStable() esperaría su respuesta.
  if (empresaId === null && rol !== 'INSPECTOR') {
    await fixture.whenStable();
  } else {
    fixture.detectChanges();
  }
  return { fixture, raiz: fixture.nativeElement as HTMLElement, http: TestBed.inject(HttpTestingController) };
}

/** Responde los pedidos de pendientes del inspector que haya en vuelo (con ceros). */
function responderPendientes(): void {
  TestBed.tick();
  TestBed.inject(HttpTestingController)
    .match('/api/tablero/bandeja-inspector')
    .forEach((pedido) => pedido.flush({ empresas: 0, circuitos: 0, lotesBiologicos: 0, cuarentenas: 0, reportes: 0 }));
}

describe('ShellApp', () => {
  afterEach(() => sessionStorage.clear());

  it('muestra el rol, el nombre y el menú del rol; un rol sin empresa (y que no es inspector) no pide nada a la API', async () => {
    const { raiz, http } = await crear('FARMACIA', null);

    expect(raiz.querySelector('.rol')?.textContent).toContain('Farmacia');
    expect(raiz.querySelector('.nombre')?.textContent).toContain('Paula Díaz');
    expect(raiz.querySelector('nav a')?.textContent).toContain('Circuitos');
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
      responderPendientes();
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

  it('el inspector ve cuántos pendientes tiene en cada entrada del menú (un solo pedido) y nadie más pide eso', async () => {
    const { fixture, raiz, http } = await crear('INSPECTOR', null);

    const pedido = http.expectOne('/api/tablero/bandeja-inspector');
    pedido.flush({ empresas: 2, circuitos: 1, lotesBiologicos: 3, cuarentenas: 4, reportes: 0 });
    await fixture.whenStable();

    const insignias = Array.from(raiz.querySelectorAll('nav a')).map((a) => [a.childNodes[1]?.textContent?.trim() ?? '', a.querySelector('.insignia')?.firstChild?.textContent ?? null]);
    expect(insignias).toEqual([
      ['Bandeja', '10'],
      ['Empresas', '2'],
      ['Circuitos', '1'],
      ['Lotes y cuarentenas', '7'],
      ['Reportes', null],
      ['Cadena y Sepolia', null],
    ]);
    expect(raiz.querySelector('.insignia .mc-solo-lectores')?.textContent).toContain('pendientes');
  });

  it('el menú del inspector sigue funcionando si el pedido de pendientes falla: sin insignias', async () => {
    const { fixture, raiz, http } = await crear('INSPECTOR', null);

    http.expectOne('/api/tablero/bandeja-inspector').flush({ status: 500, message: 'Error interno', regla: null, errors: null }, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    expect(raiz.querySelectorAll('nav a').length).toBe(6);
    expect(raiz.querySelector('.insignia')).toBeNull();
  });

  it('al cambiar de pantalla el inspector vuelve a pedir sus pendientes', async () => {
    const { fixture, http } = await crear('INSPECTOR', null);
    http.expectOne('/api/tablero/bandeja-inspector').flush({ empresas: 1, circuitos: 0, lotesBiologicos: 0, cuarentenas: 0, reportes: 0 });
    await fixture.whenStable();

    const router = TestBed.inject(Router);
    router.resetConfig([{ path: '**', children: [] }]);
    await router.navigateByUrl('/inspector/empresas');
    await vi.waitFor(() => {
      TestBed.tick();
      http.expectOne('/api/tablero/bandeja-inspector').flush({ empresas: 0, circuitos: 0, lotesBiologicos: 0, cuarentenas: 0, reportes: 0 });
    });
  });
});
