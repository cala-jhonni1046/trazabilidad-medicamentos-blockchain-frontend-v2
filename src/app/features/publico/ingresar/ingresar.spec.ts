import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { proveerClienteApi } from '../../../core/api/api.providers';
import { Ingresar } from './ingresar';

/** Prepara la pantalla con un query string dado (por ejemplo "?volver=/sede"). */
async function crear(consulta: Record<string, string> = {}): Promise<{
  raiz: HTMLElement;
  http: HttpTestingController;
  navegar: ReturnType<typeof vi.spyOn>;
  esperar: () => Promise<void>;
}> {
  sessionStorage.clear();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      proveerClienteApi(),
      // Query params de la dirección (?volver=…&motivo=…).
      { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(consulta) } } },
    ],
  });
  const router = TestBed.inject(Router);
  const navegar = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  const fixture = TestBed.createComponent(Ingresar);
  await fixture.whenStable();
  return {
    raiz: fixture.nativeElement as HTMLElement,
    http: TestBed.inject(HttpTestingController),
    navegar,
    esperar: () => fixture.whenStable(),
  };
}

/** Escribe en un campo por su etiqueta. */
function escribir(raiz: HTMLElement, etiqueta: string, valor: string): void {
  const campo = Array.from(raiz.querySelectorAll('mat-form-field')).find((f) => f.textContent?.includes(etiqueta));
  const entrada = campo?.querySelector('input') as HTMLInputElement;
  entrada.value = valor;
  entrada.dispatchEvent(new Event('input'));
  entrada.dispatchEvent(new Event('blur'));
}

function enviar(raiz: HTMLElement): void {
  (raiz.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));
}

const respuestaLogin = {
  token: 't',
  tipo: 'Bearer',
  expiraEn: '2099-01-01T00:00:00Z',
  usuarioId: 'u',
  nombre: 'Paula Díaz',
  rol: 'FARMACIA',
  empresaId: 'e1',
  esAdminEmpresa: true,
  esDirectorTecnico: false,
};

describe('Ingresar', () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it('con los campos vacíos muestra un error por campo y no llama a la API', async () => {
    const { raiz, http, esperar } = await crear();

    enviar(raiz);
    await esperar();

    const errores = Array.from(raiz.querySelectorAll('mat-error')).map((e) => e.textContent?.trim());
    expect(errores).toContain('Escribí tu correo electrónico.');
    expect(errores).toContain('Escribí tu contraseña.');
    http.expectNone('/api/auth/login');
  });

  it('un correo con formato inválido no se envía', async () => {
    const { raiz, http, esperar } = await crear();

    escribir(raiz, 'Correo', 'no-es-un-correo');
    escribir(raiz, 'Contraseña', 'clave');
    enviar(raiz);
    await esperar();

    expect(raiz.textContent).toContain('formato válido');
    http.expectNone('/api/auth/login');
  });

  it('ingresa, y va al inicio del rol', async () => {
    const { raiz, http, navegar, esperar } = await crear();

    escribir(raiz, 'Correo', 'admin@farmacia-cerroarco.demo');
    escribir(raiz, 'Contraseña', 'clave');
    enviar(raiz);
    await esperar();
    const pedido = http.expectOne('/api/auth/login');
    expect(pedido.request.body).toEqual({ email: 'admin@farmacia-cerroarco.demo', password: 'clave' });
    pedido.flush(respuestaLogin);
    await vi.waitFor(() => expect(navegar).toHaveBeenCalledWith('/farmacia'));
  });

  it('vuelve a la ruta pedida si "volver" es interna', async () => {
    const { raiz, http, navegar, esperar } = await crear({ volver: '/farmacia/stock' });

    escribir(raiz, 'Correo', 'a@b.com');
    escribir(raiz, 'Contraseña', 'clave');
    enviar(raiz);
    await esperar();
    http.expectOne('/api/auth/login').flush(respuestaLogin);

    await vi.waitFor(() => expect(navegar).toHaveBeenCalledWith('/farmacia/stock'));
  });

  it('un 401 muestra el mensaje de la API arriba del formulario y no navega', async () => {
    const { raiz, http, navegar, esperar } = await crear();

    escribir(raiz, 'Correo', 'a@b.com');
    escribir(raiz, 'Contraseña', 'mala');
    enviar(raiz);
    await esperar();
    http
      .expectOne('/api/auth/login')
      .flush(
        { status: 401, message: 'Credenciales inválidas', regla: null, errors: null },
        { status: 401, statusText: 'Unauthorized' },
      );
    await esperar();

    await vi.waitFor(() => expect(raiz.querySelector('[role="alert"]')?.textContent).toContain('Credenciales inválidas'));
    expect(navegar).not.toHaveBeenCalled();
  });

  it('un 400 con errores por campo los muestra en cada campo', async () => {
    const { raiz, http, esperar } = await crear();

    escribir(raiz, 'Correo', 'a@b.com');
    escribir(raiz, 'Contraseña', 'x');
    enviar(raiz);
    await esperar();
    http.expectOne('/api/auth/login').flush(
      {
        status: 400,
        message: 'Error de validación',
        regla: null,
        errors: [{ field: 'password', message: 'La contraseña es demasiado corta' }],
      },
      { status: 400, statusText: 'Bad Request' },
    );

    await vi.waitFor(() => expect(raiz.textContent).toContain('La contraseña es demasiado corta'));
    expect(raiz.querySelector('[role="alert"]')).toBeNull();
  });

  it('con ?motivo=vencida explica por qué hay que ingresar de nuevo', async () => {
    const { raiz } = await crear({ motivo: 'vencida' });

    expect(raiz.querySelector('[role="status"]')?.textContent).toContain('Tu sesión venció');
  });
});
