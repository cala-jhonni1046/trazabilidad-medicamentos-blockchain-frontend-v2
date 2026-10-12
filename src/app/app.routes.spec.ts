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
    // La Sede aterriza en su tablero; los demás roles, en el inicio provisorio.
    expect(navegacion.routeNativeElement?.textContent).toContain(rol === 'SEDE_CENTRAL' ? 'Resumen' : 'Hola, Ana Prueba');
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
});
