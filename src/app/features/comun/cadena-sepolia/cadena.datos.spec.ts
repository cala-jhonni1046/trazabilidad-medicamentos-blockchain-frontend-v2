import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { proveerClienteApi } from '../../../core/api/api.providers';
import { PAGINA_VACIA, errorApi } from '../../../../testing/entorno';
import { CadenaDatos, INTERVALO_SEGUIMIENTO_MS, TOPE_SEGUIMIENTO_MS } from './cadena.datos';

function crear() {
  TestBed.configureTestingModule({ providers: [CadenaDatos, provideHttpClient(), provideHttpClientTesting(), proveerClienteApi()] });
  const datos = TestBed.inject(CadenaDatos);
  const http = TestBed.inject(HttpTestingController);
  TestBed.tick();
  return { datos, http };
}

const anclaje = (estado: string, extra: object = {}) => ({
  id: 'a1', desdeNumero: 1, hastaNumero: 5, estado, confirmaciones: 0, hashAnclado: 'ab', red: 'Sepolia', ...extra,
});

describe('CadenaDatos', () => {
  afterEach(() => vi.useRealTimers());

  it('verificarCadena: pasa por "verificando" y deja el informe tal cual lo devuelve la API', async () => {
    const { datos, http } = crear();
    const promesa = datos.verificarCadena();
    expect(datos.verificacion().tipo).toBe('verificando');

    http.expectOne('/api/eventos-trazabilidad/verificacion').flush({
      integra: false, eventosVerificados: 40, primerNumeroRoto: 12, motivo: 'Hash distinto', resumen: 'La cadena se rompe',
      blockchain: { estado: 'ALTERADA', alteradoDesde: 12, alteradoHasta: 14, anclajesVerificados: 3 },
    });
    await promesa;

    const v = datos.verificacion();
    expect(v.tipo).toBe('listo');
    if (v.tipo === 'listo') {
      expect(v.informe.integra).toBe(false);
      expect(v.informe.blockchain.estado).toBe('ALTERADA');
    }
  });

  it('verificarCadena: un error de la API queda como error (no como informe)', async () => {
    const { datos, http } = crear();
    const promesa = datos.verificarCadena();
    http.expectOne('/api/eventos-trazabilidad/verificacion').flush(...errorApi(403, 'Acceso denegado'));
    await promesa;

    const v = datos.verificacion();
    expect(v.tipo).toBe('error');
  });

  it('anclarAhora: un 409 vuelve como error con su código (ANCLAJE_EN_CURSO) y no empieza a seguir nada', async () => {
    const { datos, http } = crear();
    const promesa = datos.anclarAhora();
    http.expectOne('/api/registros-blockchain/anclar').flush(...errorApi(409, 'Ya hay un anclaje en curso', 'ANCLAJE_EN_CURSO'));
    const r = await promesa;

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.regla).toBe('ANCLAJE_EN_CURSO');
    }
    expect(datos.anclajeEnSeguimiento()).toBeNull();
  });

  it('anclarAhora: un 503 (Sepolia no responde) vuelve como error', async () => {
    const { datos, http } = crear();
    const promesa = datos.anclarAhora();
    http.expectOne('/api/registros-blockchain/anclar').flush(...errorApi(503, 'La red no responde'));
    const r = await promesa;

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.status).toBe(503);
    }
  });

  it('sigue el anclaje cada 5 s hasta CONFIRMADO y entonces recarga el estado y los historiales', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
    const { datos, http } = crear();
    const promesa = datos.anclarAhora();
    http.expectOne('/api/registros-blockchain/anclar').flush(anclaje('ENVIADO'), { status: 202, statusText: 'Accepted' });
    await promesa;
    expect(datos.anclajeEnSeguimiento()?.estado).toBe('ENVIADO');

    vi.advanceTimersByTime(INTERVALO_SEGUIMIENTO_MS);
    http.expectOne('/api/registros-blockchain/a1').flush(anclaje('ENVIADO', { confirmaciones: 1 }));
    expect(datos.anclajeEnSeguimiento()?.confirmaciones).toBe(1);

    vi.advanceTimersByTime(INTERVALO_SEGUIMIENTO_MS);
    http.expectOne('/api/registros-blockchain/a1').flush(anclaje('CONFIRMADO', { confirmaciones: 3 }));
    expect(datos.anclajeEnSeguimiento()?.estado).toBe('CONFIRMADO');

    // Terminó: ya no consulta más.
    vi.advanceTimersByTime(INTERVALO_SEGUIMIENTO_MS * 3);
    http.expectNone('/api/registros-blockchain/a1');
  });

  it('un anclaje que ya vuelve FALLIDO (sin gastar) no se sigue y muestra su causa', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
    const { datos, http } = crear();
    const promesa = datos.anclarAhora();
    http.expectOne('/api/registros-blockchain/anclar').flush(anclaje('FALLIDO', { ultimoError: 'GAS_SOBRE_EL_MAXIMO' }), { status: 202, statusText: 'Accepted' });
    await promesa;

    expect(datos.anclajeEnSeguimiento()).toMatchObject({ estado: 'FALLIDO', ultimoError: 'GAS_SOBRE_EL_MAXIMO' });
    vi.advanceTimersByTime(INTERVALO_SEGUIMIENTO_MS * 2);
    http.expectNone('/api/registros-blockchain/a1');
  });

  it('si el anclaje no termina en 5 minutos, deja de seguirlo y lo avisa', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
    const { datos, http } = crear();
    const promesa = datos.anclarAhora();
    http.expectOne('/api/registros-blockchain/anclar').flush(anclaje('ENVIADO'), { status: 202, statusText: 'Accepted' });
    await promesa;

    for (let t = 0; t < TOPE_SEGUIMIENTO_MS; t += INTERVALO_SEGUIMIENTO_MS) {
      vi.advanceTimersByTime(INTERVALO_SEGUIMIENTO_MS);
      http.match('/api/registros-blockchain/a1').forEach((p) => p.flush(anclaje('ENVIADO')));
    }

    expect(datos.seguimientoVencido()).toBe(true);
    vi.advanceTimersByTime(INTERVALO_SEGUIMIENTO_MS * 2);
    http.expectNone('/api/registros-blockchain/a1');
  });

  it('un error al consultar el anclaje se muestra y corta el seguimiento', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
    const { datos, http } = crear();
    const promesa = datos.anclarAhora();
    http.expectOne('/api/registros-blockchain/anclar').flush(anclaje('ENVIADO'), { status: 202, statusText: 'Accepted' });
    await promesa;

    vi.advanceTimersByTime(INTERVALO_SEGUIMIENTO_MS);
    http.expectOne('/api/registros-blockchain/a1').flush(...errorApi(500, 'Error interno'));

    expect(datos.errorSeguimiento()).not.toBeNull();
    vi.advanceTimersByTime(INTERVALO_SEGUIMIENTO_MS * 2);
    http.expectNone('/api/registros-blockchain/a1');
  });

  it('pide los historiales paginados', () => {
    const { http } = crear();

    const anclajes = http.match((p) => p.url === '/api/registros-blockchain' && p.params.get('size') === '10');
    const eventos = http.match((p) => p.url === '/api/eventos-trazabilidad' && p.params.get('size') === '10');
    expect(anclajes.length).toBe(1);
    expect(eventos.length).toBe(1);
    anclajes[0].flush(PAGINA_VACIA);
    eventos[0].flush(PAGINA_VACIA);
  });
});
