import { TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSelectHarness } from '@angular/material/select/testing';
import { Resultado } from '../../../core/api/resultado';
import { ErrorApi } from '../../../core/errores/error-api';
import { DatosDialogoAsignar, DialogoAsignar } from './dialogo-asignar';
import { OpcionInspector } from './tablero.datos';

const INSPECTORES: readonly OpcionInspector[] = [
  { id: 'i1', legajo: 'L-001', provincia: 'MENDOZA', nombre: 'Laura Gómez' },
  { id: 'i2', legajo: 'L-002', provincia: 'SAN_JUAN', nombre: null },
];

async function crear(cambios: Partial<DatosDialogoAsignar> = {}) {
  const cerrar = vi.fn();
  const datos: DatosDialogoAsignar = {
    titulo: 'Asignar solicitud de habilitación',
    detalle: 'Farmacia Salteña · Farmacia · Salta',
    cargarInspectores: () => Promise.resolve({ ok: true, valor: INSPECTORES } as Resultado<readonly OpcionInspector[]>),
    asignar: () => Promise.resolve({ ok: true, valor: {} } as Resultado<unknown>),
    ...cambios,
  };
  TestBed.configureTestingModule({
    providers: [
      { provide: MAT_DIALOG_DATA, useValue: datos },
      { provide: MatDialogRef, useValue: { close: cerrar } },
    ],
  });
  const fixture = TestBed.createComponent(DialogoAsignar);
  await fixture.whenStable();
  const cargador: HarnessLoader = TestbedHarnessEnvironment.loader(fixture);
  return { fixture, raiz: fixture.nativeElement as HTMLElement, cerrar, cargador, datos };
}

function enviar(raiz: HTMLElement): void {
  (raiz.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));
}

describe('DialogoAsignar', () => {
  it('muestra el título y el detalle, y ofrece los inspectores (con nombre o, sin nombre, por legajo)', async () => {
    const { raiz, cargador } = await crear();

    expect(raiz.querySelector('h2')?.textContent).toBe('Asignar solicitud de habilitación');
    expect(raiz.querySelector('.detalle')?.textContent).toBe('Farmacia Salteña · Farmacia · Salta');
    const select = await cargador.getHarness(MatSelectHarness);
    await select.open();
    const opciones = await select.getOptions();
    expect(await Promise.all(opciones.map((o) => o.getText()))).toEqual([
      'Laura Gómez (L-001) · Mendoza',
      'L-002 · San Juan',
    ]);
  });

  it('sin elegir inspector pide que elija y no llama a la API', async () => {
    const asignar = vi.fn();
    const { raiz, fixture } = await crear({ asignar });

    enviar(raiz);
    await fixture.whenStable();

    expect(raiz.textContent).toContain('Elegí un inspector.');
    expect(asignar).not.toHaveBeenCalled();
  });

  it('al confirmar manda el id del inspector elegido y se cierra con su texto', async () => {
    const asignar = vi.fn().mockResolvedValue({ ok: true, valor: {} });
    const { raiz, fixture, cerrar, cargador } = await crear({ asignar });

    const select = await cargador.getHarness(MatSelectHarness);
    await select.clickOptions({ text: /Laura Gómez/ });
    enviar(raiz);
    await fixture.whenStable();

    await vi.waitFor(() => expect(cerrar).toHaveBeenCalledWith('Laura Gómez (L-001) · Mendoza'));
    expect(asignar).toHaveBeenCalledWith('i1');
  });

  it('un 409 de la API se muestra tal cual dentro del diálogo y NO lo cierra (R2 lo decide la API)', async () => {
    const error = new ErrorApi(409, 'La provincia ya tiene inspectores activos', 'R2', []);
    const asignar = vi.fn().mockResolvedValue({ ok: false, error });
    const { raiz, fixture, cerrar, cargador } = await crear({ asignar });

    const select = await cargador.getHarness(MatSelectHarness);
    await select.clickOptions({ text: /L-002/ });
    enviar(raiz);
    await fixture.whenStable();

    await vi.waitFor(() => {
      expect(raiz.querySelector('mc-error-api [role="alert"]')?.textContent).toContain('La provincia ya tiene inspectores activos');
    });
    expect(raiz.querySelector('mc-error-api .regla')?.textContent).toBe('R2');
    expect(cerrar).not.toHaveBeenCalled();
  });

  it('un 404 también se muestra dentro del diálogo', async () => {
    const asignar = vi.fn().mockResolvedValue({ ok: false, error: new ErrorApi(404, 'Empresa no encontrada', null, []) });
    const { raiz, fixture, cerrar, cargador } = await crear({ asignar });

    await (await cargador.getHarness(MatSelectHarness)).clickOptions({ text: /L-001/ });
    enviar(raiz);
    await fixture.whenStable();

    await vi.waitFor(() => expect(raiz.querySelector('mc-error-api [role="alert"]')?.textContent).toContain('Empresa no encontrada'));
    expect(cerrar).not.toHaveBeenCalled();
  });

  it('si no se pueden cargar los inspectores, muestra el error y deshabilita Asignar', async () => {
    const { raiz } = await crear({
      cargarInspectores: () => Promise.resolve({ ok: false, error: new ErrorApi(500, 'Error interno', null, []) }),
    });

    expect(raiz.querySelector('[role="alert"]')?.textContent).toContain('Error interno');
    expect((raiz.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBe(true);
  });

  it('sin inspectores activos lo dice y deshabilita Asignar', async () => {
    const { raiz } = await crear({ cargarInspectores: () => Promise.resolve({ ok: true, valor: [] }) });

    expect(raiz.querySelector('[role="status"]')?.textContent).toContain('No hay inspectores activos');
    expect((raiz.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBe(true);
  });
});
