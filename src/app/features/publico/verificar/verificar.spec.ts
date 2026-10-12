import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { proveerClienteApi } from '../../../core/api/api.providers';
import { Verificar } from './verificar';

async function crear() {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), proveerClienteApi()],
  });
  const fixture = TestBed.createComponent(Verificar);
  await fixture.whenStable();
  return {
    raiz: fixture.nativeElement as HTMLElement,
    http: TestBed.inject(HttpTestingController),
    esperar: () => fixture.whenStable(),
  };
}

/** Campo de un mat-form-field por su etiqueta (coincidencia exacta con el mat-label). */
function campo(raiz: HTMLElement, etiqueta: string): HTMLInputElement {
  const f = Array.from(raiz.querySelectorAll('mat-form-field')).find(
    (e) => e.querySelector('mat-label')?.textContent?.trim() === etiqueta,
  );
  return f?.querySelector('input') as HTMLInputElement;
}

function escribir(entrada: HTMLInputElement, valor: string): void {
  entrada.value = valor;
  entrada.dispatchEvent(new Event('input'));
  entrada.dispatchEvent(new Event('blur'));
}

function enviar(raiz: HTMLElement): void {
  (raiz.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));
}

const GTIN = '07799000001010';

const respuestaApta = {
  estado: 'APTA',
  gtin: GTIN,
  serie: 'S1',
  mensaje: 'Esta caja es original y está lista para usar.',
  producto: 'Cuyafen',
  recorrido: [{ etapa: 'FABRICADO', empresa: 'Lab', fecha: '2026-01-15' }],
};

describe('Verificar', () => {
  it('con los campos vacíos pide GTIN y serie y no llama a la API', async () => {
    const { raiz, http, esperar } = await crear();

    enviar(raiz);
    await esperar();

    expect(raiz.textContent).toContain('Escribí el GTIN de la caja.');
    expect(raiz.textContent).toContain('Escribí el número de serie de la caja.');
    http.expectNone((p) => p.url === '/api/verificacion');
  });

  it('verifica sin token y muestra el resultado, con el mensaje de la API tal cual', async () => {
    const { raiz, http, esperar } = await crear();

    escribir(campo(raiz, 'GTIN'), ` ${GTIN} `);
    escribir(campo(raiz, 'Número de serie'), 'S1');
    enviar(raiz);
    await esperar();
    const pedido = http.expectOne((p) => p.url === '/api/verificacion');
    expect(pedido.request.params.get('gtin')).toBe(GTIN);
    expect(pedido.request.params.get('serie')).toBe('S1');
    expect(pedido.request.headers.has('Authorization')).toBe(false);
    pedido.flush(respuestaApta);
    await esperar();

    await vi.waitFor(() => {
      expect(raiz.querySelector('mc-resultado-verificacion .mensaje')?.textContent).toBe(
        'Esta caja es original y está lista para usar.',
      );
    });
    expect(raiz.querySelector('mc-resultado-verificacion mc-estado')?.textContent).toContain('Apta');
  });

  it('un 400 de la API (GTIN inválido) se muestra bajo el campo, con el nombre de campo recortado', async () => {
    const { raiz, http, esperar } = await crear();

    escribir(campo(raiz, 'GTIN'), '07799000009999');
    escribir(campo(raiz, 'Número de serie'), 'X1');
    enviar(raiz);
    await esperar();
    http.expectOne((p) => p.url === '/api/verificacion').flush(
      {
        status: 400,
        message: 'Error de validación',
        regla: null,
        errors: [{ field: 'verificar.gtin', message: 'El GTIN no es válido: debe tener 14 dígitos con dígito verificador GS1 correcto' }],
      },
      { status: 400, statusText: 'Bad Request' },
    );

    await vi.waitFor(() => expect(raiz.textContent).toContain('El GTIN no es válido'));
    expect(raiz.querySelector('mc-resultado-verificacion')).toBeNull();
  });

  it('pegar un código GS1 completa GTIN y serie', async () => {
    const { raiz, esperar } = await crear();
    const pegado = campo(raiz, 'Pegar el código completo (opcional)');

    pegado.value = `(01)${GTIN}(21)L20260001S000001`;
    pegado.dispatchEvent(new Event('change'));
    await esperar();

    expect(campo(raiz, 'GTIN').value).toBe(GTIN);
    expect(campo(raiz, 'Número de serie').value).toBe('L20260001S000001');
    expect(raiz.querySelector('mc-campo-codigo .aviso')?.textContent).toContain('Código leído');
    expect(pegado.value).toBe('');
  });

  it('un código que no se reconoce avisa y no toca los campos', async () => {
    const { raiz, esperar } = await crear();
    const pegado = campo(raiz, 'Pegar el código completo (opcional)');

    pegado.value = 'esto no es un código';
    pegado.dispatchEvent(new Event('change'));
    await esperar();

    expect(raiz.querySelector('mc-campo-codigo .aviso.error')?.textContent).toContain('No pudimos leer este código');
    expect(campo(raiz, 'GTIN').value).toBe('');
  });

  it('un error que no es de campo (por ejemplo un 500) queda arriba del formulario', async () => {
    const { raiz, http, esperar } = await crear();

    escribir(campo(raiz, 'GTIN'), GTIN);
    escribir(campo(raiz, 'Número de serie'), 'S1');
    enviar(raiz);
    await esperar();
    http.expectOne((p) => p.url === '/api/verificacion').flush(
      { status: 500, message: 'Error interno', regla: null, errors: null },
      { status: 500, statusText: 'Server Error' },
    );

    await vi.waitFor(() => expect(raiz.querySelector('mc-error-api [role="alert"]')?.textContent).toContain('Error interno'));
  });
});
