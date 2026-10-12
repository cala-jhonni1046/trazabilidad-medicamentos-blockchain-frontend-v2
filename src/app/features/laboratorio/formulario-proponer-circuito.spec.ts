import { crearPantalla, errorApi } from '../../../testing/entorno';
import { FormularioProponerCircuito } from './formulario-proponer-circuito';

function escribir(raiz: HTMLElement, etiqueta: string, valor: string, blur = false) {
  const campo = Array.from(raiz.querySelectorAll('mat-form-field')).find((f) => f.querySelector('mat-label')?.textContent === etiqueta)?.querySelector('input') as HTMLInputElement;
  campo.value = valor;
  campo.dispatchEvent(new Event('input'));
  if (blur) {
    campo.dispatchEvent(new Event('blur'));
  }
}

describe('FormularioProponerCircuito', () => {
  it('al salir del campo busca la empresa por CUIT y tipo, y muestra su nombre', async () => {
    const p = crearPantalla(FormularioProponerCircuito, 'LABORATORIO', { sesion: { esDirectorTecnico: true } });

    escribir(p.raiz, 'CUIT de la distribuidora', '30-71111111-1', true);
    const pedido = await vi.waitFor(() => p.http.expectOne((r) => r.url === '/api/empresas/por-cuit'));
    expect(pedido.request.params.get('cuit')).toBe('30-71111111-1');
    expect(pedido.request.params.get('tipo')).toBe('DISTRIBUIDOR');
    pedido.flush({ id: 'd1', razonSocial: 'Distribuidora Pie de Monte', provincia: 'MENDOZA' });

    await p.esperar(() => expect(p.raiz.querySelector('.busqueda')?.textContent).toContain('Distribuidora Pie de Monte · Mendoza'));
  });

  it('si el CUIT no corresponde a una empresa habilitada, muestra el 404 de la API tal cual', async () => {
    const p = crearPantalla(FormularioProponerCircuito, 'LABORATORIO');

    escribir(p.raiz, 'CUIT de la farmacia', '30-99999999-9', true);
    (await vi.waitFor(() => p.http.expectOne((r) => r.url === '/api/empresas/por-cuit'))).flush(...errorApi(404, 'No hay una farmacia habilitada con ese CUIT'));

    await p.esperar(() => expect(p.raiz.querySelector('.busqueda.error')?.textContent).toContain('No hay una farmacia habilitada con ese CUIT'));
  });

  it('propone mandando los dos CUIT; un 409 R5 de la API se muestra arriba del formulario', async () => {
    const p = crearPantalla(FormularioProponerCircuito, 'LABORATORIO');
    escribir(p.raiz, 'CUIT de la distribuidora', '30711111111');
    escribir(p.raiz, 'CUIT de la farmacia', '30722222222');

    (p.raiz.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));
    const pedido = await vi.waitFor(() => p.http.expectOne('/api/circuitos'));
    expect(pedido.request.body).toEqual({ cuitDistribuidor: '30711111111', cuitFarmacia: '30722222222' });
    pedido.flush(...errorApi(409, 'Ya hay un circuito vigente para ese par', 'R5'));

    await p.esperar(() => expect(p.raiz.querySelector('mc-error-api [role="alert"]')?.textContent).toContain('Ya hay un circuito vigente'));
    expect(p.raiz.querySelector('.regla')?.textContent).toBe('R5');
  });
});
