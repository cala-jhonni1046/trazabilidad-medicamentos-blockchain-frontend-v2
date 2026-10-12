import { TestBed } from '@angular/core/testing';
import { AvisosService } from '../../../core/errores/avisos.service';
import { PAGINA_VACIA, boton, botones, crearPantalla, errorApi, enviarDialogo, limpiarOverlays, pagina } from '../../../../testing/entorno';
import { ListaEmpresas } from './lista-empresas';

const empresa = (cambios: object = {}) => ({
  id: 'e1', razonSocial: 'Farmacia Salteña', tipo: 'FARMACIA', cuit: '30-71234567-8', localidad: 'Salta', provincia: 'SALTA',
  estado: 'PENDIENTE', fechaSolicitud: '2026-10-08T18:00:00Z', inspectorRevisorId: null, ...cambios,
});

const accionesDe = (raiz: HTMLElement) => botones(raiz.querySelector('tbody tr') as Element);

describe('ListaEmpresas', () => {
  afterEach(limpiarOverlays);

  it('inspector, solicitud sin tomar: ofrece PDF y Tomar (todavía no Habilitar ni Rechazar)', async () => {
    const p = crearPantalla(ListaEmpresas, 'INSPECTOR', { entradas: { modo: 'bandeja' } });
    p.responder('/api/empresas/bandeja', pagina([empresa()]));

    await p.esperar(() => expect(p.raiz.querySelector('tbody tr')).not.toBeNull());

    expect(accionesDe(p.raiz)).toEqual(['PDF', 'Tomar']);
  });

  it('inspector, solicitud ya tomada: ofrece Habilitar y Rechazar', async () => {
    const p = crearPantalla(ListaEmpresas, 'INSPECTOR');
    p.responder('/api/empresas', pagina([empresa({ inspectorRevisorId: 'i1' })]));

    await p.esperar(() => expect(p.raiz.querySelector('tbody tr')).not.toBeNull());

    expect(accionesDe(p.raiz)).toEqual(['PDF', 'Habilitar', 'Rechazar']);
  });

  it('la Sede suspende una habilitada y rehabilita una suspendida; no ve acciones de inspector', async () => {
    const p = crearPantalla(ListaEmpresas, 'SEDE_CENTRAL');
    p.responder('/api/empresas', pagina([empresa({ id: 'a', estado: 'HABILITADA' }), empresa({ id: 'b', estado: 'SUSPENDIDA', motivoSuspension: 'Inspección' })]));

    await p.esperar(() => expect(p.raiz.querySelectorAll('tbody tr').length).toBe(2));

    const filas = Array.from(p.raiz.querySelectorAll('tbody tr')).map((f) => botones(f));
    expect(filas).toEqual([['PDF', 'Suspender'], ['PDF', 'Rehabilitar']]);
    expect(p.raiz.textContent).toContain('Suspensión: Inspección');
  });

  it('un rol de empresa no ve ninguna acción', async () => {
    const p = crearPantalla(ListaEmpresas, 'FARMACIA');
    p.responder('/api/empresas', pagina([empresa({ estado: 'HABILITADA' })]));

    await p.esperar(() => expect(p.raiz.querySelector('tbody tr')).not.toBeNull());

    expect(accionesDe(p.raiz)).toEqual([]);
  });

  it('suspender pide el motivo, lo manda a la API y recarga el listado', async () => {
    const p = crearPantalla(ListaEmpresas, 'SEDE_CENTRAL');
    p.responder('/api/empresas', pagina([empresa({ estado: 'HABILITADA' })]));
    await p.esperar(() => expect(p.raiz.querySelector('tbody tr')).not.toBeNull());

    boton(p.raiz, 'Suspender').click();
    await vi.waitFor(() => expect(document.querySelector('mc-dialogo-accion')).not.toBeNull());
    await enviarDialogo('Documentación vencida');

    const pedido = await vi.waitFor(() => p.http.expectOne('/api/empresas/e1/suspender'));
    expect(pedido.request.body).toEqual({ motivo: 'Documentación vencida' });
    pedido.flush(empresa({ estado: 'SUSPENDIDA' }));
    await vi.waitFor(() => {
      TestBed.tick();
      expect(p.http.match((r) => r.url === '/api/empresas').length).toBe(1);
    });
  });

  it('un 409 al tomar se muestra tal cual (con su regla) y no recarga', async () => {
    const p = crearPantalla(ListaEmpresas, 'INSPECTOR');
    const aviso = vi.spyOn(TestBed.inject(AvisosService), 'mostrarError');
    p.responder('/api/empresas', pagina([empresa()]));
    await p.esperar(() => expect(p.raiz.querySelector('tbody tr')).not.toBeNull());

    boton(p.raiz, 'Tomar').click();
    p.http.expectOne('/api/empresas/e1/tomar').flush(...errorApi(409, 'La solicitud ya fue tomada', 'TRANSICION_INVALIDA'));

    await vi.waitFor(() => expect(aviso).toHaveBeenCalledWith('TRANSICION_INVALIDA: La solicitud ya fue tomada'));
    expect(p.http.match((r) => r.url === '/api/empresas').length).toBe(0);
  });

  it('sin empresas muestra el estado vacío; si la API falla, el error y Reintentar', async () => {
    const vacia = crearPantalla(ListaEmpresas, 'SEDE_CENTRAL');
    vacia.responder('/api/empresas', PAGINA_VACIA);
    await vacia.esperar(() => expect(vacia.raiz.textContent).toContain('No hay empresas con ese filtro.'));
    TestBed.resetTestingModule();

    const caida = crearPantalla(ListaEmpresas, 'SEDE_CENTRAL');
    caida.http.match((r) => r.url === '/api/empresas')[0].flush(...errorApi(500, 'Error interno'));
    await caida.esperar(() => expect(caida.raiz.querySelector('mc-error-api [role="alert"]')?.textContent).toContain('Error interno'));
    expect(Array.from(caida.raiz.querySelectorAll('button')).some((b) => b.textContent?.includes('Reintentar'))).toBe(true);
  });

  it('filtrar por estado manda ?estado= a la API y vuelve a la primera página', async () => {
    const p = crearPantalla(ListaEmpresas, 'SEDE_CENTRAL');
    p.responder('/api/empresas', pagina([empresa()], 25));
    await p.esperar(() => expect(p.raiz.querySelector('tbody tr')).not.toBeNull());

    p.fixture.debugElement.query((d) => d.name === 'mc-filtro-estado').componentInstance.cambio.emit('HABILITADA');

    await vi.waitFor(() => {
      TestBed.tick();
      expect(p.http.match((r) => r.url === '/api/empresas' && r.params.get('estado') === 'HABILITADA' && r.params.get('page') === '0').length).toBe(1);
    });
  });
});
