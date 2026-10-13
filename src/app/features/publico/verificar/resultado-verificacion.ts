import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { VerificacionPublicaResponseDto } from '../../../core/api/modelos';
import { ROTULO_ETAPA_RECORRIDO } from '../../../shared/formato/etiquetas';
import { DiaPipe } from '../../../shared/formato/pipes-fechas';
import {
  PRESENTACION_ESTADO_VERIFICACION,
  PRESENTACION_ESTADO_ANCLAJE_CAJA,
} from '../../../shared/estados/catalogo-estados';
import { Estado } from '../../../shared/estados/estado';
import { Icono } from '../../../shared/ui/icono';

/**
 * Resultado de verificar una caja: estado, el mensaje de la API tal cual, datos del producto,
 * recorrido y registro en blockchain.
 *
 * R13 / Ley 25.326: solo se muestran los campos del contrato que se listan acá, uno por uno.
 * Nunca se vuelca la respuesta entera: así un dato personal que se colara en la respuesta
 * no aparecería en pantalla.
 */
@Component({
  selector: 'mc-resultado-verificacion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DiaPipe, Estado, Icono],
  templateUrl: './resultado-verificacion.html',
  styleUrl: './resultado-verificacion.scss',
})
export class ResultadoVerificacion {
  /** Respuesta de la API. */
  readonly resultado = input.required<VerificacionPublicaResponseDto>();

  protected readonly estado = computed(() => PRESENTACION_ESTADO_VERIFICACION[this.resultado().estado]);

  /** Presentación del anclaje, o null si la respuesta no lo trae. */
  protected readonly anclaje = computed(() => {
    const anclaje = this.resultado().anclaje;
    return anclaje == null ? null : { datos: anclaje, estado: PRESENTACION_ESTADO_ANCLAJE_CAJA[anclaje.estado] };
  });

  /**
   * Enlace a Etherscan solo si es https: el valor viene de la API y nunca se usa como
   * dirección si es de otro tipo (por ejemplo "javascript:").
   */
  protected readonly enlaceSeguro = computed(() => {
    const enlace = this.resultado().anclaje?.enlace;
    return enlace != null && enlace.startsWith('https://') ? enlace : null;
  });

  /** Texto de cada hito del recorrido (catálogo exhaustivo de EtapaRecorrido). */
  protected readonly rotuloEtapa = ROTULO_ETAPA_RECORRIDO;
}
