import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import { MatDialogHarness } from '@angular/material/dialog/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { proveerClienteApi } from '../../../core/api/api.providers';
import { PAGINA_VACIA, pagina, pedidosA, responderMosaicos } from './soporte-pruebas';
import { Tablero } from './tablero';

const EMPRESA = {
  id: 'e1',
  razonSocial: 'Farmacia Salteña S.R.L.',
  tipo: 'FARMACIA',
  localidad: 'Salta',
  provincia: 'SALTA',
  cuit: '30-71234567-8',
  fechaSolicitud: '2026-10-08T18:00:00Z',
};

async function crear() {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), proveerClienteApi()],
  });
  const fixture = TestBed.createComponent(Tablero);
  fixture.detectChanges();
  const http = TestBed.inject(HttpTestingController);
  const raiz = fixture.nativeElement as HTMLElement;
  const raizDocumento = TestbedHarnessEnvironment.documentRootLoader(fixture);
  return { fixture, http, raiz, raizDocumento };
}

async function esperar(fixture: { whenStable: () => Promise<void> }): Promise<void> {
  await vi.waitFor(async () => {
    TestBed.tick();
    await fixture.whenStable();
  });
}

describe('Tablero', () => {
  afterEach(() => {
    // Cierra diálogos y avisos que hayan quedado abiertos.
    document.querySelectorAll('.cdk-overlay-container').forEach((c) => (c.innerHTML = ''));
  });

  it('muestra los 7 mosaicos con sus números y resalta lo pendiente', async () => {
    const { fixture, http, raiz } = await crear();

    responderMosaicos(http, { empresas: 12, empresasPendientes: 2, eventos: 1500 });
    http.match((p) => p.url === '/api/empresas/sin-inspector')[0].flush(PAGINA_VACIA);
    http.match((p) => p.url === '/api/circuitos/sin-inspector')[0].flush(PAGINA_VACIA);
    await vi.waitFor(() => {
      TestBed.tick();
      fixture.detectChanges();
      expect(raiz.querySelectorAll('mc-mosaico').length).toBe(7);
      expect(raiz.textContent).not.toContain('…');
    });

    const mosaicos = Array.from(raiz.querySelectorAll('mc-mosaico')).map((m) => [
      m.querySelector('.etiqueta')?.textContent,
      m.querySelector('.valor')?.textContent?.trim(),
    ]);
    expect(mosaicos).toContainEqual(['Empresas', '12']);
    expect(mosaicos).toContainEqual(['Empresas pendientes', '2']);
    expect(mosaicos).toContainEqual(['Eventos en la cadena', '1.500']);
    expect(raiz.querySelectorAll('mc-mosaico.tono-atencion').length).toBe(1);
    expect(raiz.textContent).toContain('No hay solicitudes sin inspector.');
    expect(raiz.textContent).toContain('No hay circuitos sin inspector.');
  });

  it('si falla el resumen, los 7 mosaicos muestran "—" y las listas de pendientes siguen', async () => {
    const { fixture, http, raiz } = await crear();

    responderMosaicos(http, {}, true);
    http.match((p) => p.url === '/api/empresas/sin-inspector')[0].flush(pagina([EMPRESA]));
    http.match((p) => p.url === '/api/circuitos/sin-inspector')[0].flush(PAGINA_VACIA);
    await vi.waitFor(() => {
      TestBed.tick();
      fixture.detectChanges();
      expect(raiz.querySelectorAll('mc-mosaico').length).toBe(7);
      expect(raiz.textContent).toContain('Farmacia Salteña S.R.L.');
    });

    const valores = Array.from(raiz.querySelectorAll('mc-mosaico .valor')).map((v) => v.textContent?.trim());
    expect(valores.length).toBe(7);
    expect(valores.every((v) => v?.startsWith('—'))).toBe(true);
  });

  it('una solicitud pendiente muestra razón social, tipo, ubicación, CUIT y fecha en hora de Argentina', async () => {
    const { fixture, http, raiz } = await crear();

    responderMosaicos(http);
    http.match((p) => p.url === '/api/empresas/sin-inspector')[0].flush(pagina([EMPRESA], 25));
    http.match((p) => p.url === '/api/circuitos/sin-inspector')[0].flush(PAGINA_VACIA);
    await vi.waitFor(() => {
      TestBed.tick();
      fixture.detectChanges();
      expect(raiz.querySelector('.pendientes')).not.toBeNull();
    });

    const item = raiz.querySelector('.pendientes li')?.textContent?.replace(/\s+/g, ' ');
    expect(item).toContain('Farmacia Salteña S.R.L.');
    expect(item).toContain('Farmacia · Salta, Salta');
    expect(item).toContain('CUIT 30-71234567-8');
    expect(item).toContain('08/10/2026 15:00');
    expect(raiz.textContent).toContain('Mostrando 1 de 25');
  });

  it('una lista que falla muestra el error y permite reintentar, sin afectar a la otra', async () => {
    const { fixture, http, raiz } = await crear();

    responderMosaicos(http);
    http.match((p) => p.url === '/api/empresas/sin-inspector')[0].flush(
      { status: 500, message: 'Error interno', regla: null, errors: null },
      { status: 500, statusText: 'Server Error' },
    );
    http.match((p) => p.url === '/api/circuitos/sin-inspector')[0].flush(PAGINA_VACIA);
    await vi.waitFor(() => {
      TestBed.tick();
      fixture.detectChanges();
      expect(raiz.querySelector('.falla')?.textContent).toContain('Error interno');
    });
    expect(raiz.textContent).toContain('No hay circuitos sin inspector.');

    (Array.from(raiz.querySelectorAll('button')).find((b) => b.textContent?.includes('Reintentar')) as HTMLButtonElement).click();
    await vi.waitFor(() => {
      TestBed.tick();
      expect(http.match((p) => p.url === '/api/empresas/sin-inspector').length).toBe(1);
    });
  });

  it('asignar una solicitud: abre el diálogo, manda el inspector, avisa y recarga', async () => {
    const { fixture, http, raiz, raizDocumento } = await crear();
    const aviso = vi.spyOn(TestBed.inject(MatSnackBar), 'open');
    responderMosaicos(http);
    http.match((p) => p.url === '/api/empresas/sin-inspector')[0].flush(pagina([EMPRESA]));
    http.match((p) => p.url === '/api/circuitos/sin-inspector')[0].flush(PAGINA_VACIA);
    await vi.waitFor(() => {
      TestBed.tick();
      fixture.detectChanges();
      expect(raiz.querySelector('.pendientes button')).not.toBeNull();
    });

    (raiz.querySelector('.pendientes button') as HTMLButtonElement).click();
    const dialogo = await raizDocumento.getHarness(MatDialogHarness);
    expect(await (await dialogo.host()).text()).toContain('Farmacia Salteña S.R.L. · Farmacia · Salta');
    http
      .expectOne((p) => p.url === '/api/inspectores-anmat' && p.params.get('size') === '100')
      .flush(pagina([{ id: 'i1', legajo: 'L-001', provincia: 'MENDOZA', usuarioId: 'u1', nombre: 'Laura', apellido: 'Gómez' }]));
    // El selector aparece cuando termina de cargar la lista de inspectores.
    const select = await vi.waitFor(async () => {
      const encontrado = await raizDocumento.getHarnessOrNull(MatSelectHarness);
      expect(encontrado).not.toBeNull();
      return encontrado as MatSelectHarness;
    });
    await select.clickOptions({ text: /Laura Gómez/ });
    const documento = document.querySelector('mc-dialogo-asignar') as HTMLElement;
    (documento.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));

    const pedido = await vi.waitFor(() => http.expectOne('/api/empresas/e1/asignar'));
    expect(pedido.request.body).toEqual({ inspectorId: 'i1' });
    pedido.flush({ ...EMPRESA, estado: 'PENDIENTE' });
    await esperar(fixture);

    await vi.waitFor(() => expect(aviso).toHaveBeenCalledWith('Asignado a Laura Gómez (L-001) · Mendoza.', 'Cerrar', expect.anything()));
    await vi.waitFor(() => {
      TestBed.tick();
      expect(pedidosA(http, '/api/empresas/sin-inspector').length).toBe(1);
    });
  });
});
