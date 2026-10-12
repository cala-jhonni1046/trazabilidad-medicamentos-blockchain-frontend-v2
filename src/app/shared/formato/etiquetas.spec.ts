import { MOTIVO_DEVOLUCION, MOTIVO_REPORTE, PROVINCIA, TIPO_EMPRESA, TIPO_EVENTO } from '../../core/api/modelos';
import { ROTULO_MOTIVO_DEVOLUCION, ROTULO_MOTIVO_REPORTE, ROTULO_PROVINCIA, ROTULO_TIPO_EMPRESA, ROTULO_TIPO_EVENTO } from './etiquetas';

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

  it.each([...TIPO_EVENTO])('el tipo de evento %s tiene su texto', (tipo) => {
    expect(ROTULO_TIPO_EVENTO[tipo].length).toBeGreaterThan(0);
    expect(ROTULO_TIPO_EVENTO[tipo]).not.toContain('_');
  });

  it.each([...MOTIVO_DEVOLUCION])('el motivo de devolución %s tiene su texto', (motivo) => {
    expect(ROTULO_MOTIVO_DEVOLUCION[motivo].length).toBeGreaterThan(0);
  });

  it.each([...MOTIVO_REPORTE])('el motivo de reporte %s tiene su texto', (motivo) => {
    expect(ROTULO_MOTIVO_REPORTE[motivo].length).toBeGreaterThan(0);
  });
});
