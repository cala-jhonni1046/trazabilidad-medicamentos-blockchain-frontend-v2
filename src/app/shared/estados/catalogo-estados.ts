import {
  ESTADO_ANCLAJE,
  EstadoAnclaje,
  EstadoAuditoria,
  EstadoCuarentena,
  EstadoEnlaceCuit,
  EstadoHabilitacion,
  EstadoInspector,
  EstadoLote,
  EstadoVerificacion,
  EstadoVerificacionBlockchain,
} from '../../core/api/modelos';
import { OpcionFiltro } from '../ui/filtro-estado';
import { NombreIcono } from '../ui/iconos';

// Catálogo de estados: el ÚNICO lugar donde un valor de enum del contrato se convierte en
// tono (color) + ícono + texto. Cada enum es un Record: si el backend agrega un valor,
// al regenerar el cliente esto deja de compilar hasta mapearlo.
// Los estados se muestran siempre con las tres cosas (nunca solo color).

/** Tonos de estado: coinciden con los tokens --mc-<tono> y --mc-<tono>-suave. */
export type Tono = 'correcto' | 'atencion' | 'critico' | 'transito' | 'blockchain' | 'neutro';

/** Cómo se muestra un estado. */
export interface PresentacionEstado {
  readonly texto: string;
  readonly tono: Tono;
  readonly icono: NombreIcono;
}

/** Empresa: PENDIENTE atención; HABILITADA correcto; RECHAZADA y SUSPENDIDA crítico. */
export const PRESENTACION_ESTADO_HABILITACION: Record<EstadoHabilitacion, PresentacionEstado> = {
  PENDIENTE: { texto: 'Pendiente', tono: 'atencion', icono: 'schedule' },
  HABILITADA: { texto: 'Habilitada', tono: 'correcto', icono: 'check_circle' },
  RECHAZADA: { texto: 'Rechazada', tono: 'critico', icono: 'cancel' },
  SUSPENDIDA: { texto: 'Suspendida', tono: 'critico', icono: 'pause_circle' },
};

/**
 * Verificación pública de una caja (lo que ve el paciente). APTA correcto; YA_DISPENSADA
 * neutro (es el caso normal de una caja en manos de un paciente; el mensaje de la API explica);
 * BLOQUEADA, ROBADA y NO_EXISTE críticos; EN_DISTRIBUCION en tránsito.
 */
export const PRESENTACION_ESTADO_VERIFICACION: Record<EstadoVerificacion, PresentacionEstado> = {
  APTA: { texto: 'Apta', tono: 'correcto', icono: 'check_circle' },
  YA_DISPENSADA: { texto: 'Ya dispensada', tono: 'neutro', icono: 'person_check' },
  BLOQUEADA: { texto: 'Bloqueada', tono: 'critico', icono: 'block' },
  ROBADA: { texto: 'Robada', tono: 'critico', icono: 'report' },
  EN_DISTRIBUCION: { texto: 'En distribución', tono: 'transito', icono: 'local_shipping' },
  NO_EXISTE: { texto: 'No existe', tono: 'critico', icono: 'help' },
};

/** Anclaje en blockchain: PENDIENTE y ENVIADO esperan; CONFIRMADO correcto; FALLIDO crítico. */
export const PRESENTACION_ESTADO_ANCLAJE: Record<EstadoAnclaje, PresentacionEstado> = {
  PENDIENTE: { texto: 'Pendiente de envío', tono: 'blockchain', icono: 'schedule' },
  ENVIADO: { texto: 'Enviado, esperando confirmaciones', tono: 'blockchain', icono: 'schedule' },
  CONFIRMADO: { texto: 'Confirmado', tono: 'correcto', icono: 'verified' },
  FALLIDO: { texto: 'Fallido', tono: 'critico', icono: 'error' },
};

/** Valor que la verificación pública informa cuando el anclaje no está disponible (no es un EstadoAnclaje). */
const ANCLAJE_NO_DISPONIBLE = 'NO_DISPONIBLE';

/**
 * Presentación del `anclaje.estado` de la verificación pública. El contrato lo declara como
 * texto libre (pedido para B12: que sea un enum), así que acá se tolera cualquier valor:
 * los de {@link EstadoAnclaje} usan su presentación; NO_DISPONIBLE y cualquier valor
 * desconocido se muestran en neutro, con el texto tal cual vino (nunca rompen la pantalla).
 */
export function presentarEstadoAnclaje(valor: string): PresentacionEstado {
  if ((ESTADO_ANCLAJE as readonly string[]).includes(valor)) {
    return PRESENTACION_ESTADO_ANCLAJE[valor as EstadoAnclaje];
  }
  if (valor === ANCLAJE_NO_DISPONIBLE) {
    return { texto: 'No disponible', tono: 'neutro', icono: 'help' };
  }
  return { texto: valor === '' ? 'Estado desconocido' : valor, tono: 'neutro', icono: 'help' };
}

/** Circuito: los dos pendientes en atención; APROBADO correcto; RECHAZADO y SUSPENDIDO críticos. */
export const PRESENTACION_ESTADO_CIRCUITO: Record<EstadoEnlaceCuit, PresentacionEstado> = {
  PENDIENTE_EMPRESAS: { texto: 'Esperando a las empresas', tono: 'atencion', icono: 'schedule' },
  PENDIENTE_INSPECTOR: { texto: 'Esperando al inspector', tono: 'atencion', icono: 'schedule' },
  APROBADO: { texto: 'Aprobado', tono: 'correcto', icono: 'check_circle' },
  RECHAZADO: { texto: 'Rechazado', tono: 'critico', icono: 'cancel' },
  SUSPENDIDO: { texto: 'Suspendido', tono: 'critico', icono: 'pause_circle' },
};

/** Inspector ANMAT: ACTIVO correcto; BAJA crítico. */
export const PRESENTACION_ESTADO_INSPECTOR: Record<EstadoInspector, PresentacionEstado> = {
  ACTIVO: { texto: 'Activo', tono: 'correcto', icono: 'check_circle' },
  BAJA: { texto: 'Baja', tono: 'critico', icono: 'cancel' },
};

/** Lote: PENDIENTE_LIBERACION y CUARENTENA en atención; LIBERADO correcto; RECALL crítico. */
export const PRESENTACION_ESTADO_LOTE: Record<EstadoLote, PresentacionEstado> = {
  PENDIENTE_LIBERACION: { texto: 'Pendiente de liberación', tono: 'atencion', icono: 'schedule' },
  LIBERADO: { texto: 'Liberado', tono: 'correcto', icono: 'check_circle' },
  CUARENTENA: { texto: 'En cuarentena', tono: 'atencion', icono: 'warning' },
  RECALL: { texto: 'Recall', tono: 'critico', icono: 'report' },
};

/** Medida sanitaria: ACTIVA atención; LEVANTADA correcto; CONVERTIDA_EN_RECALL crítico. */
export const PRESENTACION_ESTADO_CUARENTENA: Record<EstadoCuarentena, PresentacionEstado> = {
  ACTIVA: { texto: 'Activa', tono: 'atencion', icono: 'warning' },
  LEVANTADA: { texto: 'Levantada', tono: 'correcto', icono: 'check_circle' },
  CONVERTIDA_EN_RECALL: { texto: 'Recall', tono: 'critico', icono: 'report' },
};

/** Reporte ciudadano: ABIERTO y EN_INVESTIGACION en atención; CERRADO correcto. */
export const PRESENTACION_ESTADO_REPORTE: Record<EstadoAuditoria, PresentacionEstado> = {
  ABIERTO: { texto: 'Abierto', tono: 'atencion', icono: 'warning' },
  EN_INVESTIGACION: { texto: 'En investigación', tono: 'atencion', icono: 'search' },
  CERRADO: { texto: 'Cerrado', tono: 'correcto', icono: 'check_circle' },
};

/** Verificación de la cadena contra la blockchain: ALTERADA es crítica. */
export const PRESENTACION_ESTADO_VERIFICACION_BLOCKCHAIN: Record<EstadoVerificacionBlockchain, PresentacionEstado> = {
  VERIFICADA: { texto: 'Verificada', tono: 'correcto', icono: 'verified' },
  ALTERADA: { texto: 'Alterada', tono: 'critico', icono: 'error' },
  NO_CONSULTADA: { texto: 'No consultada', tono: 'atencion', icono: 'warning' },
  NO_DISPONIBLE: { texto: 'No disponible', tono: 'neutro', icono: 'help' },
};

/** Opciones de un filtro por estado, con el texto del catálogo, en el orden del contrato. */
export function opcionesDeEstado<E extends string>(
  valores: readonly E[],
  catalogo: Record<E, PresentacionEstado>,
): readonly OpcionFiltro<E>[] {
  return valores.map((valor) => ({ valor, texto: catalogo[valor].texto }));
}
