import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { guardarSesionDePrueba, sesionDePrueba } from '../testing/sesion-de-prueba';
import { routes } from './app.routes';
import { proveerClienteApi } from './core/api/api.providers';
import { ROL_USUARIO, RolUsuario } from './core/api/modelos';
import { RUTA_INICIO_POR_ROL } from './core/auth/rutas-sesion';
import { SesionService } from './core/auth/sesion.service';

/** Prepara el router real de la aplicación, con o sin una sesión del rol dado. */
async function prepararNavegacion(rol: RolUsuario | null): Promise<RouterTestingHarness> {
  sessionStorage.clear();
  if (rol !== null) {
    guardarSesionDePrueba(sesionDePrueba({ rol }));
  }
  TestBed.configureTestingModule({ providers: [provideRouter(routes), provideHttpClient(), proveerClienteApi()] });
  TestBed.inject(SesionService).restaurar();
  return RouterTestingHarness.create();
}

/** URL actual del router. */
function urlActual(): string {
  return TestBed.inject(Router).url;
}

describe('rutas de la aplicación', () => {
  afterEach(() => sessionStorage.clear());

  it('sin sesión, "/" lleva a ingresar', async () => {
    const navegacion = await prepararNavegacion(null);

    await navegacion.navigateByUrl('/');

    expect(urlActual()).toBe('/ingresar');
    expect(navegacion.routeNativeElement?.textContent).toContain('Ingresar');
  });

  it('sin sesión, una ruta de un rol lleva a ingresar recordando adónde iba', async () => {
    const navegacion = await prepararNavegacion(null);

    await navegacion.navigateByUrl('/laboratorio');

    expect(urlActual()).toBe('/ingresar?volver=%2Flaboratorio');
  });

  it.each([...ROL_USUARIO])('con sesión de %s, "/" lleva a su inicio', async (rol) => {
    const navegacion = await prepararNavegacion(rol);

    await navegacion.navigateByUrl('/');

    expect(urlActual()).toBe(RUTA_INICIO_POR_ROL[rol]);
    // Cada rol aterriza en su primera pantalla; los que todavía no la tienen, en el inicio provisorio.
    const esperado = ({ SEDE_CENTRAL: 'Resumen', INSPECTOR: 'Pendientes de tu acción', LABORATORIO: 'Circuitos', DISTRIBUIDOR: 'Circuitos' } as Partial<Record<string, string>>)[rol] ?? 'Hola, Ana Prueba';
    expect(navegacion.routeNativeElement?.textContent).toContain(esperado);
  });

  it('una farmacia que pide la ruta de la Sede termina en su propio inicio', async () => {
    const navegacion = await prepararNavegacion('FARMACIA');

    await navegacion.navigateByUrl('/sede');

    expect(urlActual()).toBe('/farmacia');
  });

  it('con sesión, la pantalla de ingreso lleva al inicio del rol', async () => {
    const navegacion = await prepararNavegacion('INSPECTOR');

    await navegacion.navigateByUrl('/ingresar');

    expect(urlActual()).toBe('/inspector');
  });

  it('una ruta inexistente muestra "no encontrada"', async () => {
    const navegacion = await prepararNavegacion(null);

    await navegacion.navigateByUrl('/no-existe');

    expect(navegacion.routeNativeElement?.textContent).toContain('No encontramos esta página');
  });

  it('las pantallas del inspector y de la Sede existen dentro de su rol', async () => {
    const inspector = await prepararNavegacion('INSPECTOR');
    for (const [ruta, texto] of [['/inspector/empresas', 'Empresas registradas'], ['/inspector/circuitos', 'Circuitos'], ['/inspector/lotes', 'Lotes y cuarentenas'], ['/inspector/reportes', 'Reportes ciudadanos'], ['/inspector/cadena', 'Estado del anclaje']]) {
      await inspector.navigateByUrl(ruta);
      expect(inspector.routeNativeElement?.textContent, ruta).toContain(texto);
    }
    TestBed.resetTestingModule();

    const sede = await prepararNavegacion('SEDE_CENTRAL');
    for (const [ruta, texto] of [['/sede/inspectores', 'Inspectores ANMAT'], ['/sede/empresas', 'Empresas registradas'], ['/sede/circuitos', 'Circuitos'], ['/sede/cadena', 'Estado del anclaje'], ['/sede/usuarios', 'Usuarios del sistema']]) {
      await sede.navigateByUrl(ruta);
      expect(sede.routeNativeElement?.textContent, ruta).toContain(texto);
    }
  });

  it('un inspector no entra a las pantallas de la Sede y viceversa', async () => {
    const inspector = await prepararNavegacion('INSPECTOR');
    await inspector.navigateByUrl('/sede/inspectores');
    expect(urlActual()).toBe('/inspector');
    TestBed.resetTestingModule();

    const sede = await prepararNavegacion('SEDE_CENTRAL');
    await sede.navigateByUrl('/inspector/lotes');
    expect(urlActual()).toBe('/sede');
  });
});
