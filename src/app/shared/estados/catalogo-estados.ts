import { EstadoHabilitacion } from '../../core/api/modelos';
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
