import {
  EstadoAnclaje,
  EstadoAnclajeCaja,
  EstadoAuditoria,
  EstadoBulto,
  EstadoDespacho,
  EstadoCuarentena,
  EstadoEnlaceCuit,
  EstadoHabilitacion,
  EstadoInspector,
  EstadoLote,
  EstadoUnidad,
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

/**
 * Anclaje que cubre el recorrido de una caja en la verificación pública. CONFIRMADO correcto; ENVIADO
 * y PENDIENTE (todavía no se ancló) esperan; NO_DISPONIBLE (el anclaje está apagado en el servidor) neutro.
 * No es EstadoAnclaje (el ciclo de vida de un registro de anclaje, con FALLIDO).
 */
export const PRESENTACION_ESTADO_ANCLAJE_CAJA: Record<EstadoAnclajeCaja, PresentacionEstado> = {
  CONFIRMADO: { texto: 'Confirmado', tono: 'correcto', icono: 'verified' },
  ENVIADO: { texto: 'Enviado, esperando confirmaciones', tono: 'blockchain', icono: 'schedule' },
  PENDIENTE: { texto: 'Pendiente de anclaje', tono: 'blockchain', icono: 'schedule' },
  NO_DISPONIBLE: { texto: 'No disponible', tono: 'neutro', icono: 'help' },
};

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

/**
 * Bulto: RECIBIDO correcto; RECHAZADO y ROBADO críticos; EN_TRANSITO en tránsito;
 * ARMADO, EN_DEPOSITO y DESARMADO neutros.
 */
export const PRESENTACION_ESTADO_BULTO: Record<EstadoBulto, PresentacionEstado> = {
  ARMADO: { texto: 'Armado', tono: 'neutro', icono: 'inventory_2' },
  EN_TRANSITO: { texto: 'En tránsito', tono: 'transito', icono: 'local_shipping' },
  EN_DEPOSITO: { texto: 'En depósito', tono: 'neutro', icono: 'domain' },
  RECIBIDO: { texto: 'Recibido', tono: 'correcto', icono: 'check_circle' },
  RECHAZADO: { texto: 'Rechazado', tono: 'critico', icono: 'cancel' },
  ROBADO: { texto: 'Robado', tono: 'critico', icono: 'report' },
  DESARMADO: { texto: 'Desarmado', tono: 'neutro', icono: 'block' },
};

/** Viaje: FINALIZADO correcto; ROBADO crítico; EN_TRANSITO en tránsito; PROGRAMADO y CANCELADO neutros. */
export const PRESENTACION_ESTADO_VIAJE: Record<EstadoDespacho, PresentacionEstado> = {
  PROGRAMADO: { texto: 'Programado', tono: 'neutro', icono: 'schedule' },
  EN_TRANSITO: { texto: 'En tránsito', tono: 'transito', icono: 'local_shipping' },
  FINALIZADO: { texto: 'Finalizado', tono: 'correcto', icono: 'check_circle' },
  ROBADO: { texto: 'Robado', tono: 'critico', icono: 'report' },
  CANCELADO: { texto: 'Cancelado', tono: 'neutro', icono: 'cancel' },
};

/** Resultado de una recepción: lo decide el servidor (`conforme`). */
export const PRESENTACION_RECEPCION: Record<'conforme' | 'rechazada', PresentacionEstado> = {
  conforme: { texto: 'Conforme', tono: 'correcto', icono: 'check_circle' },
  rechazada: { texto: 'Rechazada', tono: 'critico', icono: 'cancel' },
};

/**
 * Caja (unidad trazable): EN_STOCK correcto; DEVUELTA atención; ROBADA y RECHAZADA críticas;
 * EN_TRANSITO en tránsito; el resto neutro.
 */
export const PRESENTACION_ESTADO_UNIDAD: Record<EstadoUnidad, PresentacionEstado> = {
  EN_LABORATORIO: { texto: 'En laboratorio', tono: 'neutro', icono: 'inventory_2' },
  EN_TRANSITO: { texto: 'En tránsito', tono: 'transito', icono: 'local_shipping' },
  EN_DEPOSITO: { texto: 'En depósito', tono: 'neutro', icono: 'domain' },
  EN_STOCK: { texto: 'En stock', tono: 'correcto', icono: 'check_circle' },
  DISPENSADA: { texto: 'Dispensada', tono: 'neutro', icono: 'person_check' },
  DEVUELTA: { texto: 'Devuelta', tono: 'atencion', icono: 'undo' },
  ROBADA: { texto: 'Robada', tono: 'critico', icono: 'report' },
  RECHAZADA: { texto: 'Rechazada', tono: 'critico', icono: 'cancel' },
};

/** Una dispensación está vigente o anulada (`anulada` lo informa la API). */
export const PRESENTACION_DISPENSACION: Record<'vigente' | 'anulada', PresentacionEstado> = {
  vigente: { texto: 'Dispensada', tono: 'correcto', icono: 'person_check' },
  anulada: { texto: 'Anulada', tono: 'neutro', icono: 'undo' },
};
