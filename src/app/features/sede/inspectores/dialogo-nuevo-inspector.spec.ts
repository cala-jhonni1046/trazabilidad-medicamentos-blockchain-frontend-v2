import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { proveerClienteApi } from '../../../core/api/api.providers';
import { errorApi } from '../../../../testing/entorno';
import { DialogoNuevoInspector } from './dialogo-nuevo-inspector';

function crear() {
  const cerrar = vi.fn();
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), proveerClienteApi(), { provide: MatDialogRef, useValue: { close: cerrar } }],
  });
  const fixture = TestBed.createComponent(DialogoNuevoInspector);
  fixture.detectChanges();
  const raiz = fixture.nativeElement as HTMLElement;
  const campo = (etiqueta: string) =>
    Array.from(raiz.querySelectorAll('mat-form-field')).find((f) => f.querySelector('mat-label')?.textContent === etiqueta)?.querySelector('input') as HTMLInputElement;
  const escribir = (etiqueta: string, valor: string) => {
    const c = campo(etiqueta);
    c.value = valor;
    c.dispatchEvent(new Event('input'));
  };
  const enviar = () => (raiz.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));
  return { fixture, raiz, cerrar, escribir, enviar, http: TestBed.inject(HttpTestingController) };
}

function completar(escribir: (e: string, v: string) => void) {
  escribir('Nombre', 'Laura');
  escribir('Apellido', 'Gómez');
  escribir('Legajo', 'L-009');
  escribir('DNI', '20111222');
  escribir('Correo electrónico', 'laura@anmat.demo');
  escribir('Contraseña inicial', 'Clave-de-prueba-1');
}

describe('DialogoNuevoInspector', () => {
  it('con todo vacío pide los campos y no llama a la API', async () => {
    const { raiz, fixture, enviar, http } = crear();

    enviar();
    await fixture.whenStable();

    expect(raiz.textContent).toContain('Escribí el nombre.');
    expect(raiz.textContent).toContain('Elegí la provincia.');
    http.expectNone('/api/inspectores-anmat');
  });

  it('un 409 INSPECTOR_DUPLICADO se muestra tal cual arriba del formulario y no se cierra', async () => {
    const { raiz, fixture, enviar, escribir, http, cerrar } = crear();
    completar(escribir);
    // La provincia es un mat-select: se elige por su valor interno.
    (raiz.querySelector('mat-select') as HTMLElement).click();
    await vi.waitFor(() => expect(document.querySelectorAll('mat-option').length).toBeGreaterThan(0));
    (Array.from(document.querySelectorAll('mat-option')).find((o) => o.textContent?.includes('Mendoza')) as HTMLElement).click();
    enviar();
    await fixture.whenStable();

    const pedido = await vi.waitFor(() => http.expectOne('/api/inspectores-anmat'));
    expect(pedido.request.body).toMatchObject({ legajo: 'L-009', dni: '20111222', provincia: 'MENDOZA', nombre: 'Laura' });
    pedido.flush(...errorApi(409, 'Ya existe un inspector con ese legajo', 'INSPECTOR_DUPLICADO'));

    await vi.waitFor(() => expect(raiz.querySelector('mc-error-api [role="alert"]')?.textContent).toContain('Ya existe un inspector con ese legajo'));
    expect(raiz.querySelector('.regla')?.textContent).toBe('INSPECTOR_DUPLICADO');
    expect(cerrar).not.toHaveBeenCalled();
    document.querySelectorAll('.cdk-overlay-container').forEach((c) => (c.innerHTML = ''));
  });
});
