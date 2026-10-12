import { PAGINA_VACIA, crearPantalla, errorApi, pagina } from '../../../../testing/entorno';
import { VerificarYReportar } from './verificar-y-reportar';
import { MisReportes } from '../reportes/mis-reportes';

function escribir(raiz: HTMLElement, contenedor: string, etiqueta: string, valor: string) {
  const campo = Array.from(raiz.querySelectorAll(`${contenedor} mat-form-field`)).find((f) => f.querySelector('mat-label')?.textContent === etiqueta)?.querySelector('input') as HTMLInputElement;
  campo.value = valor;
  campo.dispatchEvent(new Event('input'));
}

describe('Paciente', () => {
  it('al verificar una caja, sus datos pasan al formulario de reporte', async () => {
    const p = crearPantalla(VerificarYReportar, 'PACIENTE');
    escribir(p.raiz, 'mc-verificar', 'GTIN', '07799000001010');
    escribir(p.raiz, 'mc-verificar', 'Número de serie', 'S1');
    (p.raiz.querySelector('mc-verificar form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));

    (await vi.waitFor(() => p.http.expectOne((r) => r.url === '/api/verificacion'))).flush({
      estado: 'APTA', gtin: '07799000001010', serie: 'S1', mensaje: 'Esta caja es original', recorrido: [],
    });

    await p.esperar(() => {
      const gtin = Array.from(p.raiz.querySelectorAll('mc-formulario-reporte mat-form-field')).find((f) => f.querySelector('mat-label')?.textContent === 'GTIN')?.querySelector('input') as HTMLInputElement;
      expect(gtin.value).toBe('07799000001010');
    });
  });

  it('el reporte sin completar pide los campos obligatorios y no llama a la API', async () => {
    const p = crearPantalla(VerificarYReportar, 'PACIENTE');

    (p.raiz.querySelector('mc-formulario-reporte form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));

    await p.esperar(() => expect(p.raiz.querySelector('mc-formulario-reporte')?.textContent).toContain('Elegí qué pasó.'));
    expect(p.raiz.querySelector('mc-formulario-reporte')?.textContent).toContain('Elegí la provincia donde la conseguiste.');
    p.http.expectNone('/api/reportes-ciudadanos');
  });

  it('un 409 al reportar se muestra tal cual arriba del formulario', async () => {
    const p = crearPantalla(VerificarYReportar, 'PACIENTE');
    escribir(p.raiz, 'mc-formulario-reporte', 'GTIN', '07799000001010');
    escribir(p.raiz, 'mc-formulario-reporte', 'Número de serie', 'S9');
    for (const select of Array.from(p.raiz.querySelectorAll('mc-formulario-reporte mat-select'))) {
      (select as HTMLElement).click();
      const opcion = await vi.waitFor(() => {
        const o = document.querySelector('mat-option') as HTMLElement | null;
        expect(o).not.toBeNull();
        return o as HTMLElement;
      });
      opcion.click();
      await vi.waitFor(() => expect(document.querySelector('mat-option')).toBeNull());
    }

    (p.raiz.querySelector('mc-formulario-reporte form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));
    const pedido = await vi.waitFor(() => p.http.expectOne('/api/reportes-ciudadanos'));
    expect(pedido.request.body).toMatchObject({ gtin: '07799000001010', serie: 'S9', motivo: 'SOSPECHA_FALSIFICACION' });
    pedido.flush(...errorApi(409, 'Ya reportaste esta caja', 'REPORTE_DUPLICADO'));

    await p.esperar(() => expect(p.raiz.querySelector('mc-formulario-reporte mc-error-api [role="alert"]')?.textContent).toContain('Ya reportaste esta caja'));
    expect(p.raiz.querySelector('mc-formulario-reporte .confirmacion')).toBeNull();
  });

  it('"Mis reportes" muestra los reportes propios sin acciones de inspector ni la conclusión', async () => {
    const p = crearPantalla(MisReportes, 'PACIENTE');
    p.responder('/api/reportes-ciudadanos', pagina([
      { id: 'r1', codigo: 'REP-0001', gtinReportado: '07799000001010', serieReportada: 'S1', motivo: 'ENVASE_DANADO', descripcion: 'Caja abierta', estado: 'EN_INVESTIGACION', provincia: 'MENDOZA', fechaReporte: '2026-10-08T18:00:00Z', cajaExiste: true },
    ]));

    await p.esperar(() => expect(p.raiz.querySelector('tbody tr')).not.toBeNull());
    const botones = Array.from(p.raiz.querySelectorAll('tbody button, tbody a')).map((b) => b.textContent?.trim());
    expect(botones.join(' ')).not.toMatch(/Tomar|Cerrar|medidas/);
    expect(p.raiz.textContent).toContain('REP-0001');
    expect(p.raiz.textContent).toContain('En investigación');
    expect(p.raiz.textContent).not.toContain('Conclusión');
  });

  it('sin reportes, estado vacío', async () => {
    const p = crearPantalla(MisReportes, 'PACIENTE');
    p.responder('/api/reportes-ciudadanos', PAGINA_VACIA);

    await p.esperar(() => expect(p.raiz.textContent).toContain('No hay reportes con ese filtro.'));
  });
});
