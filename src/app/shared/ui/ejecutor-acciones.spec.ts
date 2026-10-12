import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { AvisosService } from '../../core/errores/avisos.service';
import { ErrorApi } from '../../core/errores/error-api';
import { EjecutorAcciones, textoDeError } from './ejecutor-acciones';

describe('EjecutorAcciones', () => {
  const avisos = { mostrarExito: vi.fn(), mostrarError: vi.fn() };
  const abrir = vi.fn();

  beforeEach(() => {
    avisos.mostrarExito.mockReset();
    avisos.mostrarError.mockReset();
    abrir.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: AvisosService, useValue: avisos },
        { provide: MatDialog, useValue: { open: abrir } },
      ],
    });
  });

  it('directa: si la API acepta, avisa el éxito y devuelve true', async () => {
    const hecho = await TestBed.inject(EjecutorAcciones).directa(() => Promise.resolve({ ok: true, valor: {} }), 'Tomada.');

    expect(hecho).toBe(true);
    expect(avisos.mostrarExito).toHaveBeenCalledWith('Tomada.');
  });

  it('directa: si la API rechaza, muestra su mensaje con el código de la regla, tal cual', async () => {
    const error = new ErrorApi(409, 'La solicitud ya fue tomada', 'TRANSICION_INVALIDA', []);

    const hecho = await TestBed.inject(EjecutorAcciones).directa(() => Promise.resolve({ ok: false, error }), 'Tomada.');

    expect(hecho).toBe(false);
    expect(avisos.mostrarError).toHaveBeenCalledWith('TRANSICION_INVALIDA: La solicitud ya fue tomada');
    expect(avisos.mostrarExito).not.toHaveBeenCalled();
  });

  it('conDialogo: avisa el éxito solo si el diálogo terminó bien', async () => {
    abrir.mockReturnValueOnce({ afterClosed: () => of(true) }).mockReturnValueOnce({ afterClosed: () => of(undefined) });
    const ejecutor = TestBed.inject(EjecutorAcciones);
    const datos = { titulo: 'x', boton: 'Ok', accion: () => Promise.resolve({ ok: true as const, valor: {} }) };

    expect(await ejecutor.conDialogo(datos, 'Hecho.')).toBe(true);
    expect(await ejecutor.conDialogo(datos, 'Otra vez.')).toBe(false);
    expect(avisos.mostrarExito).toHaveBeenCalledTimes(1);
    expect(avisos.mostrarExito).toHaveBeenCalledWith('Hecho.');
  });

  it('textoDeError: sin regla, solo el mensaje', () => {
    expect(textoDeError(new ErrorApi(404, 'No encontrada', null, []))).toBe('No encontrada');
  });
});
