import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { proveerClienteApi } from './api.providers';
import { BultosService } from './generado/services/bultos.service';
import { VerificacionPublicaService } from './generado/services/verificacion-publica.service';

/** Configura HttpClient de prueba más los proveedores extra que reciba. */
function configurar(proveedoresExtra: Provider[]): HttpTestingController {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), ...proveedoresExtra],
  });
  return TestBed.inject(HttpTestingController);
}

// Cada test termina con http.verify() (ningún pedido sin atender). Va dentro del test y
// no en un afterEach: si un test falla, su pedido pendiente no arrastra a los siguientes.
describe('proveerClienteApi', () => {
  it('las operaciones salen a /api/... relativo, no a //api/...', () => {
    const http = configurar([proveerClienteApi()]);
    const servicio = TestBed.inject(VerificacionPublicaService);

    servicio.verificarCaja({ gtin: '07791234567898', serie: 'L20260001S000001' }).subscribe();

    const pedido = http.expectOne((p) => p.url === '/api/verificacion');
    expect(pedido.request.url.startsWith('//')).toBe(false);
    expect(pedido.request.params.get('gtin')).toBe('07791234567898');
    expect(pedido.request.params.get('serie')).toBe('L20260001S000001');
    pedido.flush({});
    http.verify();
  });

  it('las rutas con parámetros también quedan relativas: /api/bultos/{id}', () => {
    const http = configurar([proveerClienteApi()]);
    const servicio = TestBed.inject(BultosService);
    const id = '6f1c2a3b-0000-4000-8000-000000000001';

    servicio.obtenerBulto({ id }).subscribe();

    http.expectOne(`/api/bultos/${id}`).flush({});
    http.verify();
  });

  it('sin proveerClienteApi, la raíz por defecto del generador ("/") daría //api/... (por eso existe)', () => {
    const http = configurar([]);
    const servicio = TestBed.inject(VerificacionPublicaService);

    servicio.verificarCaja({ gtin: '07791234567898', serie: 'S1' }).subscribe();

    // "//api/verificacion" es una URL a otro host ("api"): el navegador nunca llegaría al backend.
    http.expectOne((p) => p.url === '//api/verificacion').flush({});
    http.verify();
  });
});
