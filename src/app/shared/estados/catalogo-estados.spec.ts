import { ESTADO_HABILITACION } from '../../core/api/modelos';
import { ICONOS } from '../ui/iconos';
import { PRESENTACION_ESTADO_HABILITACION } from './catalogo-estados';

describe('catálogo de estados', () => {
  it.each([...ESTADO_HABILITACION])('EstadoHabilitacion %s tiene texto, tono e ícono existente', (estado) => {
    const presentacion = PRESENTACION_ESTADO_HABILITACION[estado];

    expect(presentacion.texto.length).toBeGreaterThan(0);
    expect(presentacion.tono).toBeTruthy();
    expect(ICONOS[presentacion.icono]).toContain('<svg');
  });

  it('SUSPENDIDA y RECHAZADA son críticas; PENDIENTE, atención; HABILITADA, correcta', () => {
    expect(PRESENTACION_ESTADO_HABILITACION.SUSPENDIDA.tono).toBe('critico');
    expect(PRESENTACION_ESTADO_HABILITACION.RECHAZADA.tono).toBe('critico');
    expect(PRESENTACION_ESTADO_HABILITACION.PENDIENTE.tono).toBe('atencion');
    expect(PRESENTACION_ESTADO_HABILITACION.HABILITADA.tono).toBe('correcto');
  });
});
