import { PROVINCIA, TIPO_EMPRESA } from '../../core/api/modelos';
import { ROTULO_PROVINCIA, ROTULO_TIPO_EMPRESA } from './etiquetas';

describe('etiquetas de dominio', () => {
  it.each([...PROVINCIA])('la provincia %s tiene su nombre', (provincia) => {
    expect(ROTULO_PROVINCIA[provincia].length).toBeGreaterThan(0);
    expect(ROTULO_PROVINCIA[provincia]).not.toContain('_');
  });

  it.each([...TIPO_EMPRESA])('el tipo %s tiene su nombre', (tipo) => {
    expect(ROTULO_TIPO_EMPRESA[tipo].length).toBeGreaterThan(0);
  });

  it('los nombres con tilde están bien escritos', () => {
    expect(ROTULO_PROVINCIA.CORDOBA).toBe('Córdoba');
    expect(ROTULO_PROVINCIA.TUCUMAN).toBe('Tucumán');
    expect(ROTULO_TIPO_EMPRESA.DISTRIBUIDOR).toBe('Distribuidora');
  });
});
