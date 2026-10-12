import { ESTADO_ANCLAJE, ESTADO_HABILITACION, ESTADO_VERIFICACION } from '../../core/api/modelos';
import { ICONOS } from '../ui/iconos';
import {
  PRESENTACION_ESTADO_ANCLAJE,
  PRESENTACION_ESTADO_HABILITACION,
  PRESENTACION_ESTADO_VERIFICACION,
  presentarEstadoAnclaje,
} from './catalogo-estados';

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

describe('catálogo: verificación pública', () => {
  it.each([...ESTADO_VERIFICACION])('%s tiene texto, tono e ícono existente', (estado) => {
    const presentacion = PRESENTACION_ESTADO_VERIFICACION[estado];

    expect(presentacion.texto.length).toBeGreaterThan(0);
    expect(ICONOS[presentacion.icono]).toContain('<svg');
  });

  it('BLOQUEADA, ROBADA y NO_EXISTE son críticas; YA_DISPENSADA neutra; EN_DISTRIBUCION en tránsito; APTA correcta', () => {
    expect(PRESENTACION_ESTADO_VERIFICACION.BLOQUEADA.tono).toBe('critico');
    expect(PRESENTACION_ESTADO_VERIFICACION.ROBADA.tono).toBe('critico');
    expect(PRESENTACION_ESTADO_VERIFICACION.NO_EXISTE.tono).toBe('critico');
    expect(PRESENTACION_ESTADO_VERIFICACION.YA_DISPENSADA.tono).toBe('neutro');
    expect(PRESENTACION_ESTADO_VERIFICACION.EN_DISTRIBUCION.tono).toBe('transito');
    expect(PRESENTACION_ESTADO_VERIFICACION.APTA.tono).toBe('correcto');
  });
});

describe('catálogo: anclaje', () => {
  it.each([...ESTADO_ANCLAJE])('EstadoAnclaje %s tiene texto, tono e ícono existente', (estado) => {
    const presentacion = PRESENTACION_ESTADO_ANCLAJE[estado];

    expect(presentacion.texto.length).toBeGreaterThan(0);
    expect(ICONOS[presentacion.icono]).toContain('<svg');
  });

  it('presentarEstadoAnclaje usa el catálogo para los valores conocidos', () => {
    expect(presentarEstadoAnclaje('CONFIRMADO')).toBe(PRESENTACION_ESTADO_ANCLAJE.CONFIRMADO);
    expect(presentarEstadoAnclaje('FALLIDO').tono).toBe('critico');
  });

  it('NO_DISPONIBLE y cualquier valor desconocido caen en neutro, sin romper', () => {
    expect(presentarEstadoAnclaje('NO_DISPONIBLE')).toEqual({ texto: 'No disponible', tono: 'neutro', icono: 'help' });
    expect(presentarEstadoAnclaje('VALOR_NUEVO_DEL_BACKEND')).toEqual({
      texto: 'VALOR_NUEVO_DEL_BACKEND',
      tono: 'neutro',
      icono: 'help',
    });
    expect(presentarEstadoAnclaje('').texto).toBe('Estado desconocido');
  });
});
