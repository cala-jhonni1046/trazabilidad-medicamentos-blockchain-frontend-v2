import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { proveerClienteApi } from '../../../core/api/api.providers';
import { errorApi } from '../../../../testing/entorno';
import { DatosDialogoNuevoUsuario, DialogoNuevoUsuario } from './dialogo-nuevo-usuario';

function crear(datos: DatosDialogoNuevoUsuario) {
  const cerrar = vi.fn();
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(), provideHttpClientTesting(), proveerClienteApi(),
      { provide: MAT_DIALOG_DATA, useValue: datos },
      { provide: MatDialogRef, useValue: { close: cerrar } },
    ],
  });
  const fixture = TestBed.createComponent(DialogoNuevoUsuario);
  fixture.detectChanges();
  const raiz = fixture.nativeElement as HTMLElement;
  const escribir = (etiqueta: string, valor: string) => {
    const c = Array.from(raiz.querySelectorAll('mat-form-field')).find((f) => f.querySelector('mat-label')?.textContent === etiqueta)?.querySelector('input') as HTMLInputElement;
    c.value = valor;
    c.dispatchEvent(new Event('input'));
  };
  return { fixture, raiz, cerrar, escribir, http: TestBed.inject(HttpTestingController), enviar: () => (raiz.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true })) };
}

describe('DialogoNuevoUsuario', () => {
  const DATOS: DatosDialogoNuevoUsuario = { titulo: 'Crear usuario de la Sede', roles: [{ valor: 'SEDE_CENTRAL', texto: 'Sede Central ANMAT' }], conMarcasDeEmpresa: false };

  it('con un solo rol posible ya viene elegido y manda sus datos sin marcas de empresa', async () => {
    const { fixture, escribir, enviar, http } = crear(DATOS);
    escribir('Nombre', 'Ana');
    escribir('Apellido', 'Ríos');
    escribir('DNI', '30111222');
    escribir('Correo electrónico', 'ana@anmat.demo');
    escribir('Contraseña inicial', 'Clave-de-prueba-1');

    enviar();
    await fixture.whenStable();

    const pedido = await vi.waitFor(() => http.expectOne('/api/usuarios'));
    expect(pedido.request.body).toEqual({ nombre: 'Ana', apellido: 'Ríos', dni: '30111222', email: 'ana@anmat.demo', password: 'Clave-de-prueba-1', rol: 'SEDE_CENTRAL' });
  });

  it('ROL_NO_PERMITIDO (409) se muestra tal cual y el diálogo no se cierra', async () => {
    const { fixture, raiz, escribir, enviar, http, cerrar } = crear(DATOS);
    for (const [e, v] of [['Nombre', 'Ana'], ['Apellido', 'Ríos'], ['DNI', '30111222'], ['Correo electrónico', 'ana@anmat.demo'], ['Contraseña inicial', 'x']]) {
      escribir(e, v);
    }

    enviar();
    await fixture.whenStable();
    (await vi.waitFor(() => http.expectOne('/api/usuarios'))).flush(...errorApi(409, 'No podés crear ese rol', 'ROL_NO_PERMITIDO'));

    await vi.waitFor(() => expect(raiz.querySelector('mc-error-api [role="alert"]')?.textContent).toContain('No podés crear ese rol'));
    expect(raiz.querySelector('.regla')?.textContent).toBe('ROL_NO_PERMITIDO');
    expect(cerrar).not.toHaveBeenCalled();
  });

  it('para empresas ofrece las marcas de administrador y director técnico', () => {
    const { raiz } = crear({ ...DATOS, conMarcasDeEmpresa: true });

    expect(raiz.textContent).toContain('Administrador de la empresa');
    expect(raiz.textContent).toContain('Director técnico');
  });
});
