import { crearPantalla, errorApi, limpiarOverlays } from '../../../../testing/entorno';
import { RegistrarEmpresa } from './registrar-empresa';

const DATOS = {
  tipo: 'FARMACIA', cuit: '30-71000010-3', razonSocial: 'Farmacia del Sol', gln: '7799000001058', provincia: 'MENDOZA',
  localidad: 'Godoy Cruz', domicilio: 'Av. Sol 100', numeroHabilitacion: '', directorTecnico: '', adminNombre: 'Laura', adminApellido: 'Gómez',
  adminDni: '30111007', adminEmail: 'laura@farmacia-del-sol.test', adminPassword: 'Clave-De-Prueba-1', adminEsDirectorTecnico: false,
};

function crear() {
  const p = crearPantalla(RegistrarEmpresa, 'PACIENTE');
  const componente = p.fixture.componentInstance as unknown as { modelo: { set: (v: object) => void; update: (f: (v: object) => object) => void }; documento: { set: (f: File | null) => void } };
  return { ...p, llenar: (cambios: object = {}) => componente.modelo.set({ ...DATOS, ...cambios }), adjuntar: () => componente.documento.set(new File(['%PDF-1.4'], 'habilitacion.pdf', { type: 'application/pdf' })) };
}

function enviar(raiz: HTMLElement) {
  (raiz.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));
}

describe('RegistrarEmpresa', () => {
  afterEach(limpiarOverlays);

  it('sin completar pide cada dato y el PDF, y no llama a la API', async () => {
    const p = crear();
    enviar(p.raiz);

    await p.esperar(() => {
      expect(p.raiz.textContent).toContain('Elegí qué tipo de empresa es.');
      expect(p.raiz.textContent).toContain('Escribí el CUIT.');
      expect(p.raiz.textContent).toContain('Elegí el PDF de la habilitación.');
    });
    p.http.expectNone('/api/registro/empresas');
  });

  it('manda los datos como multipart con el PDF y muestra el mensaje de la API; la contraseña no queda en pantalla', async () => {
    const p = crear();
    p.llenar();
    p.adjuntar();
    p.fixture.detectChanges();
    enviar(p.raiz);

    const pedido = await vi.waitFor(() => p.http.expectOne('/api/registro/empresas'));
    const cuerpo = pedido.request.body as FormData;
    expect(cuerpo).toBeInstanceOf(FormData);
    expect(cuerpo.get('cuit')).toBe('30-71000010-3');
    expect(cuerpo.get('provincia')).toBe('MENDOZA');
    expect(cuerpo.get('adminEmail')).toBe('laura@farmacia-del-sol.test');
    expect(cuerpo.get('documento')).toBeInstanceOf(File);
    expect(cuerpo.has('numeroHabilitacion')).toBe(false);
    pedido.flush({ estado: 'PENDIENTE', identificador: '30-71000010-3', mensaje: 'Recibimos tu solicitud: un inspector la va a revisar.' });

    await p.esperar(() => expect(p.raiz.querySelector('.listo')?.textContent).toContain('Recibimos tu solicitud: un inspector la va a revisar.'));
    expect(p.raiz.querySelector('.listo')?.textContent).toContain('Pendiente de revisión');
    expect(p.raiz.querySelector('form')).toBeNull();
    expect(p.raiz.textContent).not.toContain('Clave-De-Prueba-1');
  });

  it('la casilla del director técnico solo aparece para un laboratorio, y para otros tipos nunca se manda en true', async () => {
    const p = crear();
    p.llenar();
    p.fixture.detectChanges();
    expect(p.raiz.querySelector('mat-checkbox')).toBeNull();

    p.llenar({ tipo: 'LABORATORIO', adminEsDirectorTecnico: true });
    p.adjuntar();
    p.fixture.detectChanges();
    expect(p.raiz.querySelector('mat-checkbox')).not.toBeNull();

    p.llenar({ tipo: 'FARMACIA', adminEsDirectorTecnico: true });
    enviar(p.raiz);
    const pedido = await vi.waitFor(() => p.http.expectOne('/api/registro/empresas'));
    expect((pedido.request.body as FormData).get('adminEsDirectorTecnico')).toBe('false');
  });

  it('un 400 de la API va al campo que dice; un 409 EMPRESA_DUPLICADA se ve arriba, con su código', async () => {
    const p = crear();
    p.llenar();
    p.adjuntar();
    p.fixture.detectChanges();
    enviar(p.raiz);
    (await vi.waitFor(() => p.http.expectOne('/api/registro/empresas'))).flush(
      { status: 400, message: 'Error de validación', regla: null, errors: [{ field: 'cuit', message: 'El CUIT no es válido' }] },
      { status: 400, statusText: 'Bad Request' },
    );
    await p.esperar(() => expect(p.raiz.querySelector('mat-error')?.textContent).toContain('El CUIT no es válido'));

    // Corrige el CUIT (el error del servidor se va al cambiar el dato) y reenvía.
    p.llenar({ cuit: '30-71000011-1' });
    p.fixture.detectChanges();
    enviar(p.raiz);
    (await vi.waitFor(() => p.http.expectOne('/api/registro/empresas'))).flush(...errorApi(409, 'Ya hay una empresa con ese CUIT', 'EMPRESA_DUPLICADA'));
    await p.esperar(() => expect(p.raiz.querySelector('mc-error-api [role="alert"]')?.textContent).toContain('Ya hay una empresa con ese CUIT'));
    expect(p.raiz.querySelector('mc-error-api .regla')?.textContent).toBe('EMPRESA_DUPLICADA');
  });

  it('un error del PDF que marca la API se ve junto al archivo', async () => {
    const p = crear();
    p.llenar();
    p.adjuntar();
    p.fixture.detectChanges();
    enviar(p.raiz);
    (await vi.waitFor(() => p.http.expectOne('/api/registro/empresas'))).flush(
      { status: 400, message: 'El archivo no es un PDF válido', regla: null, errors: null },
      { status: 400, statusText: 'Bad Request' },
    );

    await p.esperar(() => expect(p.raiz.textContent).toContain('El archivo no es un PDF válido'));
  });
});
