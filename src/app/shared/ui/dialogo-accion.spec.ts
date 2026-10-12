import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Resultado } from '../../core/api/resultado';
import { ErrorApi } from '../../core/errores/error-api';
import { DatosDialogoAccion, DialogoAccion } from './dialogo-accion';

async function crear(cambios: Partial<DatosDialogoAccion> = {}) {
  const cerrar = vi.fn();
  const datos: DatosDialogoAccion = {
    titulo: 'Suspender empresa',
    detalle: 'Farmacia Sur',
    campo: { etiqueta: 'Motivo' },
    boton: 'Suspender',
    accion: () => Promise.resolve({ ok: true, valor: {} } as Resultado<unknown>),
    ...cambios,
  };
  TestBed.configureTestingModule({
    providers: [
      { provide: MAT_DIALOG_DATA, useValue: datos },
      { provide: MatDialogRef, useValue: { close: cerrar } },
    ],
  });
  const fixture = TestBed.createComponent(DialogoAccion);
  await fixture.whenStable();
  const raiz = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    raiz,
    cerrar,
    escribir: (texto: string) => {
      const area = raiz.querySelector('textarea') as HTMLTextAreaElement;
      area.value = texto;
      area.dispatchEvent(new Event('input'));
    },
    enviar: () => (raiz.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true })),
  };
}

describe('DialogoAccion', () => {
  it('con campo obligatorio pide el texto y no llama a la API si falta', async () => {
    const accion = vi.fn();
    const { raiz, fixture, enviar } = await crear({ accion });

    enviar();
    await fixture.whenStable();

    expect(raiz.textContent).toContain('Completá: motivo.');
    expect(accion).not.toHaveBeenCalled();
  });

  it('manda el texto escrito (sin espacios de los costados) y se cierra al aceptar la API', async () => {
    const accion = vi.fn().mockResolvedValue({ ok: true, valor: {} });
    const { fixture, enviar, escribir, cerrar } = await crear({ accion });

    escribir('  Documentación vencida  ');
    enviar();
    await fixture.whenStable();

    await vi.waitFor(() => expect(cerrar).toHaveBeenCalledWith(true));
    expect(accion).toHaveBeenCalledWith('Documentación vencida', '');
  });

  it('un error de la API (409) se muestra tal cual con su regla y NO cierra el diálogo', async () => {
    const accion = vi.fn().mockResolvedValue({ ok: false, error: new ErrorApi(409, 'Transición inválida', 'TRANSICION_INVALIDA', []) });
    const { raiz, fixture, enviar, escribir, cerrar } = await crear({ accion });

    escribir('x');
    enviar();
    await fixture.whenStable();

    await vi.waitFor(() => expect(raiz.querySelector('[role="alert"]')?.textContent).toContain('Transición inválida'));
    expect(raiz.querySelector('.regla')?.textContent).toBe('TRANSICION_INVALIDA');
    expect(cerrar).not.toHaveBeenCalled();
  });

  it('sin campo es una confirmación simple: no pide texto y muestra el aviso', async () => {
    const accion = vi.fn().mockResolvedValue({ ok: true, valor: {} });
    const { raiz, fixture, enviar, cerrar } = await crear({ campo: undefined, aviso: 'Costo estimado: 0,0004 ETH', boton: 'Anclar ahora', accion });

    expect(raiz.querySelector('textarea')).toBeNull();
    expect(raiz.textContent).toContain('Costo estimado: 0,0004 ETH');
    enviar();
    await fixture.whenStable();

    await vi.waitFor(() => expect(cerrar).toHaveBeenCalledWith(true));
    expect(accion).toHaveBeenCalledWith('', '');
  });
});
