import { PAGINA_VACIA, boton, crearPantalla, pagina } from '../../../../testing/entorno';
import { Medicamentos } from './medicamentos';

describe('Medicamentos', () => {
  afterEach(() => document.querySelectorAll('.cdk-overlay-container').forEach((c) => (c.innerHTML = '')));

  it('lista el catálogo con GTIN y conservación; sin rango térmico muestra una raya', async () => {
    const p = crearPantalla(Medicamentos, 'LABORATORIO');
    p.responder('/api/medicamentos', pagina([
      { id: 'm1', nombreComercial: 'Cuyafen', principioActivo: 'Ibuprofeno', concentracion: '400 mg', formaFarmaceutica: 'Comprimido', presentacion: 'Caja x 20', gtin: '07799000001010', biologico: false, temperaturaMinima: 15, temperaturaMaxima: 25 },
      { id: 'm2', nombreComercial: 'Vacuna AVX', principioActivo: 'Virus inactivado', concentracion: '0,5 ml', formaFarmaceutica: 'Inyectable', presentacion: 'Vial', gtin: '07799000002024', biologico: true },
    ]));

    await p.esperar(() => expect(p.raiz.querySelectorAll('tbody tr').length).toBe(2));
    const filas = Array.from(p.raiz.querySelectorAll('tbody tr')).map((f) => f.textContent?.replace(/\s+/g, ' ') ?? '');
    expect(filas[0]).toContain('15 a 25 °C');
    expect(filas[1]).toContain('biológico');
    expect(filas[1]).toContain('—');
  });

  it('sin medicamentos explica que hacen falta para los lotes; "Registrar" abre el alta', async () => {
    const p = crearPantalla(Medicamentos, 'LABORATORIO');
    p.responder('/api/medicamentos', PAGINA_VACIA);

    await p.esperar(() => expect(p.raiz.textContent).toContain('Los necesitás para registrar lotes.'));
    boton(p.raiz, 'Registrar un medicamento').click();
    await vi.waitFor(() => expect(document.querySelector('mc-dialogo-nuevo-medicamento')).not.toBeNull());
  });
});
