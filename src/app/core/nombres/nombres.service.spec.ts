import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { proveerClienteApi } from '../api/api.providers';
import { NombresService } from './nombres.service';

describe('NombresService', () => {
  let http: HttpTestingController;
  let nombres: NombresService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), proveerClienteApi()] });
    http = TestBed.inject(HttpTestingController);
    nombres = TestBed.inject(NombresService);
  });

  it('pide cada empresa una sola vez, aunque se consulte varias veces', async () => {
    const primera = firstValueFrom(nombres.empresa('e1'));
    const segunda = firstValueFrom(nombres.empresa('e1'));
    http.expectOne('/api/empresas/e1').flush({ id: 'e1', razonSocial: 'Farmacia Sur' });

    expect((await primera)?.razonSocial).toBe('Farmacia Sur');
    expect((await segunda)?.razonSocial).toBe('Farmacia Sur');
    expect((await firstValueFrom(nombres.empresa('e1')))?.razonSocial).toBe('Farmacia Sur');
    http.verify();
  });

  it('arma "Nombre Apellido" del usuario y lo guarda', async () => {
    const promesa = firstValueFrom(nombres.nombreUsuario('u1'));
    http.expectOne('/api/usuarios/u1').flush({ id: 'u1', nombre: 'Laura', apellido: 'Gómez' });

    expect(await promesa).toBe('Laura Gómez');
    expect(await firstValueFrom(nombres.nombreUsuario('u1'))).toBe('Laura Gómez');
    http.verify();
  });

  it('si falla devuelve null y NO guarda el fallo: el próximo intento vuelve a pedir', async () => {
    const fallida = firstValueFrom(nombres.empresa('e2'));
    http.expectOne('/api/empresas/e2').flush(
      { status: 404, message: 'No encontrada', regla: null, errors: null },
      { status: 404, statusText: 'Not Found' },
    );
    expect(await fallida).toBeNull();

    const reintento = firstValueFrom(nombres.empresa('e2'));
    http.expectOne('/api/empresas/e2').flush({ id: 'e2', razonSocial: 'Lab Andino' });
    expect((await reintento)?.razonSocial).toBe('Lab Andino');
  });

  it('vaciar() olvida lo guardado', async () => {
    const primera = firstValueFrom(nombres.empresa('e3'));
    http.expectOne('/api/empresas/e3').flush({ id: 'e3', razonSocial: 'A' });
    await primera;

    nombres.vaciar();
    const otra = firstValueFrom(nombres.empresa('e3'));
    http.expectOne('/api/empresas/e3').flush({ id: 'e3', razonSocial: 'B' });

    expect((await otra)?.razonSocial).toBe('B');
  });
});
