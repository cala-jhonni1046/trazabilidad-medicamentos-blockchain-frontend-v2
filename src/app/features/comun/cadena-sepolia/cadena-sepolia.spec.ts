import { TestBed } from '@angular/core/testing';
import { PAGINA_VACIA, boton, crearPantalla, enviarDialogo, errorApi, limpiarOverlays, pagina } from '../../../../testing/entorno';
import { CadenaSepolia } from './cadena-sepolia';

const ESTADO = {
  habilitado: true, red: 'Sepolia', chainId: 11155111, contrato: '0xC0ntr4t0', enlaceContrato: 'https://sepolia.etherscan.io/address/0xC0ntr4t0',
  billetera: '0xB1lleter4', enlaceBilletera: 'javascript:alert(1)', saldoEth: '0.52', costoPorAnclajeEth: '0.0004', anclajesEstimados: 1300,
  ultimoNumeroLocal: 40, ultimoNumeroAnclado: 35, eventosSinAnclar: 5, anclajeAutomaticoFrenado: false, gasMinimo: 100000, gasMaximo: 500000,
};

async function cargar(rol: 'SEDE_CENTRAL' | 'INSPECTOR', estado: object = ESTADO) {
  const p = crearPantalla(CadenaSepolia, rol);
  p.responder('/api/registros-blockchain/estado', estado);
  p.http.match((r) => r.url === '/api/registros-blockchain' && r.params.has('size'))[0].flush(PAGINA_VACIA);
  p.http.match((r) => r.url === '/api/eventos-trazabilidad' && r.params.has('size'))[0].flush(PAGINA_VACIA);
  await p.esperar(() => expect(p.raiz.textContent).toContain('Último evento local'));
  return p;
}

describe('CadenaSepolia', () => {
  afterEach(limpiarOverlays);

  it('muestra el estado de la API; el enlace de Etherscan solo si es https', async () => {
    const p = await cargar('SEDE_CENTRAL');

    const texto = p.raiz.textContent ?? '';
    expect(texto).toContain('#40');
    expect(texto).toContain('Sepolia');
    expect(texto).toContain('0.52 ETH');
    const enlaces = Array.from(p.raiz.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(enlaces).toContain('https://sepolia.etherscan.io/address/0xC0ntr4t0');
    expect(enlaces).not.toContain('javascript:alert(1)');
  });

  it('muestra tal cual el mensaje de la API (frenos del anclaje automático)', async () => {
    const p = await cargar('SEDE_CENTRAL', { ...ESTADO, mensaje: 'Anclaje frenado: saldo insuficiente', anclajeAutomaticoFrenado: true });

    expect(p.raiz.textContent).toContain('Anclaje frenado: saldo insuficiente');
    expect(p.raiz.textContent).toContain('El anclaje automático está frenado.');
  });

  it('con el anclaje deshabilitado lo dice y solo muestra lo local', async () => {
    const p = await cargar('SEDE_CENTRAL', { habilitado: false, ultimoNumeroLocal: 12, anclajeAutomaticoFrenado: false, gasMinimo: 1, gasMaximo: 2 });

    expect(p.raiz.textContent).toContain('Deshabilitado en este entorno');
    expect(p.raiz.textContent).not.toContain('Contrato');
  });

  it('solo la Sede ve "Anclar ya"; el inspector, no', async () => {
    const sede = await cargar('SEDE_CENTRAL');
    expect(Array.from(sede.raiz.querySelectorAll('button')).some((b) => b.textContent?.includes('Anclar ya'))).toBe(true);
    TestBed.resetTestingModule();

    const inspector = await cargar('INSPECTOR');
    expect(Array.from(inspector.raiz.querySelectorAll('button')).some((b) => b.textContent?.includes('Anclar ya'))).toBe(false);
    expect(Array.from(inspector.raiz.querySelectorAll('button')).some((b) => b.textContent?.includes('Verificar ahora'))).toBe(true);
  });

  it('verificar la cadena: una blockchain ALTERADA se muestra en crítico con el rango', async () => {
    const p = await cargar('INSPECTOR');

    boton(p.raiz, 'Verificar ahora').click();
    p.http.expectOne('/api/eventos-trazabilidad/verificacion').flush({
      integra: true, eventosVerificados: 40, resumen: 'La base parece íntegra pero no coincide con Sepolia',
      blockchain: { estado: 'ALTERADA', alteradoDesde: 12, alteradoHasta: 14, anclajesVerificados: 3 },
    });

    await p.esperar(() => expect(p.raiz.querySelector('.informe')).not.toBeNull());
    const informe = p.raiz.querySelector('.informe') as HTMLElement;
    expect(informe.textContent).toContain('La base parece íntegra pero no coincide con Sepolia');
    expect(informe.querySelector('mc-estado')?.classList.contains('tono-critico')).toBe(true);
    expect(informe.textContent).toContain('eventos #12 a #14');
  });

  it('verificar la cadena: una cadena no íntegra se marca como rota', async () => {
    const p = await cargar('SEDE_CENTRAL');

    boton(p.raiz, 'Verificar ahora').click();
    p.http.expectOne('/api/eventos-trazabilidad/verificacion').flush({
      integra: false, eventosVerificados: 40, primerNumeroRoto: 7, motivo: 'El hash del evento 7 no coincide', resumen: 'Cadena alterada',
      blockchain: { estado: 'NO_CONSULTADA', anclajesVerificados: 0 },
    });

    await p.esperar(() => expect(p.raiz.querySelector('.informe.rota')).not.toBeNull());
    expect(p.raiz.querySelector('.informe')?.textContent).toContain('se rompe en el evento #7');
  });

  it('"Anclar ya" pide confirmación con el costo y, si la API responde 409, lo muestra tal cual', async () => {
    const p = await cargar('SEDE_CENTRAL');

    boton(p.raiz, 'Anclar ya').click();
    await vi.waitFor(() => expect(document.querySelector('mc-dialogo-accion')?.textContent).toContain('Costo estimado: 0.0004 ETH'));
    await enviarDialogo();
    p.http.expectOne('/api/registros-blockchain/anclar').flush(...errorApi(409, 'No hay eventos nuevos para anclar', 'SIN_EVENTOS_NUEVOS'));

    await vi.waitFor(() => expect(document.querySelector('mc-dialogo-accion [role="alert"]')?.textContent).toContain('No hay eventos nuevos para anclar'));
    expect(document.querySelector('mc-dialogo-accion .regla')?.textContent).toBe('SIN_EVENTOS_NUEVOS');
  });

  it('muestra las tablas de anclajes y de eventos con el tipo en español', async () => {
    const p = crearPantalla(CadenaSepolia, 'SEDE_CENTRAL');
    p.responder('/api/registros-blockchain/estado', ESTADO);
    p.http.match((r) => r.url === '/api/registros-blockchain' && r.params.has('size'))[0].flush(
      pagina([{ id: 'a1', desdeNumero: 1, hastaNumero: 5, hashAnclado: 'a'.repeat(64), estado: 'FALLIDO', ultimoError: 'REVERT', fechaCreacion: '2026-10-08T18:00:00Z', confirmaciones: 0 }]),
    );
    p.http.match((r) => r.url === '/api/eventos-trazabilidad' && r.params.has('size'))[0].flush(
      pagina([{ id: 'ev1', numero: 40, tipo: 'RUPTURA_FRIO', fechaHora: '2026-10-08T18:00:00Z', hash: 'b'.repeat(64), hashAnterior: 'c'.repeat(64) }]),
    );

    await p.esperar(() => expect(p.raiz.textContent).toContain('Ruptura de cadena de frío'));
    expect(p.raiz.textContent).toContain('#1 a #5');
    expect(p.raiz.textContent).toContain('Fallido');
    expect(p.raiz.textContent).toContain('REVERT');
    expect(p.raiz.textContent).toContain('08/10/2026 15:00');
  });
});
