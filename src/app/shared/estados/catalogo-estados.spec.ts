import {
  ESTADO_ANCLAJE,
  ESTADO_AUDITORIA,
  ESTADO_BULTO,
  ESTADO_DESPACHO,
  ESTADO_CUARENTENA,
  ESTADO_ENLACE_CUIT,
  ESTADO_HABILITACION,
  ESTADO_INSPECTOR,
  ESTADO_LOTE,
  ESTADO_UNIDAD,
  ESTADO_VERIFICACION,
  ESTADO_VERIFICACION_BLOCKCHAIN,
} from '../../core/api/modelos';
import { ICONOS } from '../ui/iconos';
import {
  PRESENTACION_ESTADO_ANCLAJE,
  PRESENTACION_DISPENSACION,
  PRESENTACION_ESTADO_BULTO,
  PRESENTACION_ESTADO_UNIDAD,
  PRESENTACION_ESTADO_CIRCUITO,
  PRESENTACION_ESTADO_VIAJE,
  PRESENTACION_RECEPCION,
  PRESENTACION_ESTADO_CUARENTENA,
  PRESENTACION_ESTADO_INSPECTOR,
  PRESENTACION_ESTADO_LOTE,
  PRESENTACION_ESTADO_REPORTE,
  PRESENTACION_ESTADO_VERIFICACION_BLOCKCHAIN,
  opcionesDeEstado,
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

describe('catálogo: resto de los estados', () => {
  const catalogos = [
    ['EstadoEnlaceCuit', ESTADO_ENLACE_CUIT, PRESENTACION_ESTADO_CIRCUITO],
    ['EstadoInspector', ESTADO_INSPECTOR, PRESENTACION_ESTADO_INSPECTOR],
    ['EstadoLote', ESTADO_LOTE, PRESENTACION_ESTADO_LOTE],
    ['EstadoCuarentena', ESTADO_CUARENTENA, PRESENTACION_ESTADO_CUARENTENA],
    ['EstadoAuditoria', ESTADO_AUDITORIA, PRESENTACION_ESTADO_REPORTE],
    ['EstadoVerificacionBlockchain', ESTADO_VERIFICACION_BLOCKCHAIN, PRESENTACION_ESTADO_VERIFICACION_BLOCKCHAIN],
    ['EstadoBulto', ESTADO_BULTO, PRESENTACION_ESTADO_BULTO],
    ['EstadoDespacho', ESTADO_DESPACHO, PRESENTACION_ESTADO_VIAJE],
    ['EstadoUnidad', ESTADO_UNIDAD, PRESENTACION_ESTADO_UNIDAD],
  ] as const;

  it.each(catalogos)('%s: cada valor del contrato tiene texto, tono e ícono existente', (_nombre, valores, catalogo) => {
    for (const valor of valores as readonly string[]) {
      const presentacion = (catalogo as Record<string, { texto: string; icono: keyof typeof ICONOS }>)[valor];
      expect(presentacion.texto.length).toBeGreaterThan(0);
      expect(ICONOS[presentacion.icono]).toContain('<svg');
    }
  });

  it('ALTERADA, RECALL, SUSPENDIDO y BAJA son críticos; las medidas y lotes en cuarentena, atención', () => {
    expect(PRESENTACION_ESTADO_VERIFICACION_BLOCKCHAIN.ALTERADA.tono).toBe('critico');
    expect(PRESENTACION_ESTADO_LOTE.RECALL.tono).toBe('critico');
    expect(PRESENTACION_ESTADO_CIRCUITO.SUSPENDIDO.tono).toBe('critico');
    expect(PRESENTACION_ESTADO_INSPECTOR.BAJA.tono).toBe('critico');
    expect(PRESENTACION_ESTADO_CUARENTENA.ACTIVA.tono).toBe('atencion');
    expect(PRESENTACION_ESTADO_LOTE.CUARENTENA.tono).toBe('atencion');
    expect(PRESENTACION_ESTADO_LOTE.PENDIENTE_LIBERACION.tono).toBe('atencion');
  });

  it('opcionesDeEstado arma las opciones del filtro con los textos del catálogo', () => {
    expect(opcionesDeEstado(ESTADO_INSPECTOR, PRESENTACION_ESTADO_INSPECTOR)).toEqual([
      { valor: 'ACTIVO', texto: 'Activo' },
      { valor: 'BAJA', texto: 'Baja' },
    ]);
  });
});

describe('catálogo: bultos, viajes y recepciones', () => {
  it('ROBADO y RECHAZADO son críticos; EN_TRANSITO en tránsito; RECIBIDO y FINALIZADO correctos', () => {
    expect(PRESENTACION_ESTADO_BULTO.ROBADO.tono).toBe('critico');
    expect(PRESENTACION_ESTADO_BULTO.RECHAZADO.tono).toBe('critico');
    expect(PRESENTACION_ESTADO_BULTO.EN_TRANSITO.tono).toBe('transito');
    expect(PRESENTACION_ESTADO_BULTO.RECIBIDO.tono).toBe('correcto');
    expect(PRESENTACION_ESTADO_VIAJE.ROBADO.tono).toBe('critico');
    expect(PRESENTACION_ESTADO_VIAJE.FINALIZADO.tono).toBe('correcto');
    expect(PRESENTACION_ESTADO_VIAJE.CANCELADO.tono).toBe('neutro');
  });

  it('la recepción conforme es correcta y la rechazada, crítica, con ícono existente', () => {
    expect(PRESENTACION_RECEPCION.conforme.tono).toBe('correcto');
    expect(PRESENTACION_RECEPCION.rechazada.tono).toBe('critico');
    expect(ICONOS[PRESENTACION_RECEPCION.rechazada.icono]).toContain('<svg');
  });
});

describe('catálogo: cajas y dispensaciones', () => {
  it('ROBADA y RECHAZADA son críticas, DEVUELTA atención y EN_STOCK correcta', () => {
    expect(PRESENTACION_ESTADO_UNIDAD.ROBADA.tono).toBe('critico');
    expect(PRESENTACION_ESTADO_UNIDAD.RECHAZADA.tono).toBe('critico');
    expect(PRESENTACION_ESTADO_UNIDAD.DEVUELTA.tono).toBe('atencion');
    expect(PRESENTACION_ESTADO_UNIDAD.EN_STOCK.tono).toBe('correcto');
  });

  it('una dispensación vigente es correcta y una anulada, neutra', () => {
    expect(PRESENTACION_DISPENSACION.vigente.tono).toBe('correcto');
    expect(PRESENTACION_DISPENSACION.anulada.tono).toBe('neutro');
    expect(ICONOS[PRESENTACION_DISPENSACION.anulada.icono]).toContain('<svg');
  });
});
