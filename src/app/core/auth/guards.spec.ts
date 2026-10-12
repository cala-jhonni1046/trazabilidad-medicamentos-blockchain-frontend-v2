import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import {
  GuardResult,
  MaybeAsync,
  PartialMatchRouteSnapshot,
  Router,
  UrlSegment,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { guardarSesionDePrueba, sesionDePrueba } from '../../../testing/sesion-de-prueba';
import { RolUsuario } from '../api/modelos';
import { invitadoGuard, rolGuard, sesionGuard } from './guards';
import { SesionService } from './sesion.service';

/** Configura el entorno y, si se indica, deja una sesión activa con ese rol. */
function configurar(rol: RolUsuario | null): void {
  sessionStorage.clear();
  if (rol !== null) {
    guardarSesionDePrueba(sesionDePrueba({ rol }));
  }
  TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });
  TestBed.inject(SesionService).restaurar();
}

/** Resultado de un guard como texto: "true", "false" o la URL de la redirección. */
function comoTexto(resultado: MaybeAsync<GuardResult>): string {
  if (resultado instanceof UrlTree) {
    return TestBed.inject(Router).serializeUrl(resultado);
  }
  return String(resultado);
}

/**
 * Tercer argumento de un CanMatchFn en Angular 22 (la ruta parcial ya reconocida).
 * Nuestros guards no lo usan: alcanza con un objeto vacío.
 */
const INSTANTANEA = {} as PartialMatchRouteSnapshot;

/** Segmentos de una ruta pedida, por ejemplo "sede/empresas". */
function segmentos(ruta: string): UrlSegment[] {
  return ruta.split('/').map((parte) => new UrlSegment(parte, {}));
}

describe('guards', () => {
  afterEach(() => sessionStorage.clear());

  it('rolGuard deja pasar al rol indicado', () => {
    configurar('SEDE_CENTRAL');

    const resultado = TestBed.runInInjectionContext(() => rolGuard(['SEDE_CENTRAL'])({}, segmentos('sede'), INSTANTANEA));

    expect(comoTexto(resultado)).toBe('true');
  });

  it('rolGuard lleva a otro rol al inicio de su propio rol', () => {
    configurar('FARMACIA');

    const resultado = TestBed.runInInjectionContext(() => rolGuard(['SEDE_CENTRAL'])({}, segmentos('sede'), INSTANTANEA));

    expect(comoTexto(resultado)).toBe('/farmacia');
  });

  it('rolGuard sin sesión lleva a ingresar, recordando la ruta pedida', () => {
    configurar(null);

    const resultado = TestBed.runInInjectionContext(() =>
      rolGuard(['SEDE_CENTRAL'])({}, segmentos('sede/empresas'), INSTANTANEA),
    );

    expect(comoTexto(resultado)).toBe('/ingresar?volver=%2Fsede%2Fempresas');
  });

  it('sesionGuard deja pasar con cualquier rol y sin sesión lleva a ingresar', () => {
    configurar('PACIENTE');
    expect(comoTexto(TestBed.runInInjectionContext(() => sesionGuard({}, segmentos('cuenta'), INSTANTANEA)))).toBe('true');

    TestBed.resetTestingModule();
    configurar(null);
    expect(comoTexto(TestBed.runInInjectionContext(() => sesionGuard({}, segmentos('cuenta'), INSTANTANEA)))).toBe(
      '/ingresar?volver=%2Fcuenta',
    );
  });

  it('invitadoGuard deja pasar sin sesión y con sesión lleva al inicio del rol', () => {
    configurar(null);
    expect(comoTexto(TestBed.runInInjectionContext(() => invitadoGuard({}, segmentos('ingresar'), INSTANTANEA)))).toBe('true');

    TestBed.resetTestingModule();
    configurar('INSPECTOR');
    expect(comoTexto(TestBed.runInInjectionContext(() => invitadoGuard({}, segmentos('ingresar'), INSTANTANEA)))).toBe(
      '/inspector',
    );
  });
});
