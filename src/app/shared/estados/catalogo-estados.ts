import { EstadoAnclaje, EstadoHabilitacion, EstadoVerificacion, ESTADO_ANCLAJE } from '../../core/api/modelos';
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
