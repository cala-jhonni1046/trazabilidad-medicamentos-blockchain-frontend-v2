import { crearPantalla, errorApi } from '../../../../testing/entorno';
import { RegistrarPaciente } from './registrar-paciente';

function crear() {
  const p = crearPantalla(RegistrarPaciente, 'PACIENTE');
  const componente = p.fixture.componentInstance as unknown as { modelo: { set: (v: object) => void } };
  return { ...p, llenar: (dni = '31222333') => componente.modelo.set({ nombre: 'Pía', apellido: 'Gómez', dni, email: 'pia@ejemplo.test', password: 'Clave-De-Prueba-1' }) };
}

function enviar(raiz: HTMLElement) {
  (raiz.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));
}

describe('RegistrarPaciente', () => {
  it('sin completar pide los datos y no llama a la API', async () => {
    const p = crear();
    enviar(p.raiz);

    await p.esperar(() => expect(p.raiz.textContent).toContain('Escribí tu DNI.'));
    p.http.expectNone('/api/registro/pacientes');
  });

  it('crea la cuenta, muestra el mensaje de la API y no deja el DNI ni la contraseña en pantalla', async () => {
    const p = crear();
    p.llenar();
    p.fixture.detectChanges();
    enviar(p.raiz);

    const pedido = await vi.waitFor(() => p.http.expectOne('/api/registro/pacientes'));
    expect(pedido.request.body).toEqual({ nombre: 'Pía', apellido: 'Gómez', dni: '31222333', email: 'pia@ejemplo.test', password: 'Clave-De-Prueba-1' });
    pedido.flush({ estado: 'ACTIVA', identificador: 'pia@ejemplo.test', mensaje: 'Tu cuenta quedó creada.' });

    await p.esperar(() => expect(p.raiz.querySelector('.listo')?.textContent).toContain('Tu cuenta quedó creada.'));
    expect(p.raiz.textContent).not.toContain('31222333');
    expect(p.raiz.textContent).not.toContain('Clave-De-Prueba-1');
  });

  it('un 409 REGISTRO_NO_COMPLETADO se muestra tal cual (mensaje genérico de la API) y un 400, en su campo', async () => {
    const p = crear();
    p.llenar();
    p.fixture.detectChanges();
    enviar(p.raiz);
    (await vi.waitFor(() => p.http.expectOne('/api/registro/pacientes'))).flush(
      { status: 400, message: 'Error de validación', regla: null, errors: [{ field: 'dni', message: 'El DNI debe tener 8 dígitos' }] },
      { status: 400, statusText: 'Bad Request' },
    );
    await p.esperar(() => expect(p.raiz.querySelector('mat-error')?.textContent).toContain('El DNI debe tener 8 dígitos'));

    // Corrige el DNI (el error del servidor se va al cambiar el dato) y reenvía.
    p.llenar('31222334');
    p.fixture.detectChanges();
    enviar(p.raiz);
    (await vi.waitFor(() => p.http.expectOne('/api/registro/pacientes'))).flush(...errorApi(409, 'No se pudo completar el registro', 'REGISTRO_NO_COMPLETADO'));
    await p.esperar(() => expect(p.raiz.querySelector('mc-error-api [role="alert"]')?.textContent).toContain('No se pudo completar el registro'));
  });
});
