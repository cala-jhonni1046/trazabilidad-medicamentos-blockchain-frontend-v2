import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AvisosService } from './avisos.service';

describe('AvisosService', () => {
  it('mostrarError abre un aviso con "Cerrar" y anuncio prioritario', () => {
    const abrir = vi.spyOn(TestBed.inject(MatSnackBar), 'open');

    TestBed.inject(AvisosService).mostrarError('No hay conexión con el servidor.');

    expect(abrir).toHaveBeenCalledWith(
      'No hay conexión con el servidor.',
      'Cerrar',
      expect.objectContaining({ politeness: 'assertive' }),
    );
  });
});
