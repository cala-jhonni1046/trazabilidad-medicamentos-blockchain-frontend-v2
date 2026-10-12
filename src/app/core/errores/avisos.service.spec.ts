import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AvisosService } from './avisos.service';

describe('AvisosService', () => {
  it('mostrarError abre un aviso con "Cerrar" y anuncio prioritario', async () => {
    const abrir = vi.spyOn(TestBed.inject(MatSnackBar), 'open');

    await TestBed.inject(AvisosService).mostrarError('No hay conexión con el servidor.');

    expect(abrir).toHaveBeenCalledWith('No hay conexión con el servidor.', 'Cerrar', expect.objectContaining({ politeness: 'assertive' }));
  });

  it('mostrarExito abre un aviso con "Cerrar" y anuncio sin interrupción', async () => {
    const abrir = vi.spyOn(TestBed.inject(MatSnackBar), 'open');

    await TestBed.inject(AvisosService).mostrarExito('Listo.');

    expect(abrir).toHaveBeenCalledWith('Listo.', 'Cerrar', expect.objectContaining({ politeness: 'polite' }));
  });
});
