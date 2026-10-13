import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ResultadoRecorridoDto } from '../../../core/api/modelos';
import { ROTULO_TIPO_CODIGO_BUSCADO, ROTULO_TIPO_EVENTO, rotuloEntidad } from '../../../shared/formato/etiquetas';
import { FechaHoraPipe } from '../../../shared/formato/pipes-fechas';
import { Hash } from '../../../shared/ui/hash';

/**
 * Un resultado de la trazabilidad por código: qué se encontró y sus eventos, del más viejo al más nuevo.
 *
 * R13 / Ley 25.326: de cada evento se muestran SOLO número, tipo, entidad, fecha y hash, uno por uno.
 * No se vuelca `datosJson` ni se muestran los ids de actor: así un dato que no debería estar ahí
 * (la API ya lo excluye de los eventos) tampoco llegaría a la pantalla.
 */
@Component({
  selector: 'mc-resultado-recorrido',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FechaHoraPipe, Hash],
  template: `
    @let r = resultado();
    <article class="resultado">
      <h3>{{ rotuloTipo[r.tipo] }} <code>{{ r.codigo }}</code></h3>
      <p class="secundario">
        Lote <code>{{ r.loteCodigo }}</code> · {{ r.medicamentoNombre }} · {{ r.laboratorioRazonSocial }}
      </p>
      @if (r.truncado) {
        <p class="aviso" role="status">Hay más eventos de los que se muestran (el máximo es 1.000): se ven los más viejos.</p>
      }
      @if (r.eventos.length === 0) {
        <p class="mc-vacio">Todavía no hay eventos para esto.</p>
      } @else {
        <ol class="linea" [attr.aria-label]="'Eventos de ' + rotuloTipo[r.tipo].toLowerCase() + ' ' + r.codigo">
          @for (e of r.eventos; track e.id) {
            <li>
              <span class="numero">#{{ e.numero }}</span>
              <span class="que">
                <strong>{{ rotuloEvento[e.tipo] }}</strong>
                <span class="secundario">{{ rotuloEntidad(e.entidadTipo) }} · {{ e.fechaHora | fechaHora }}</span>
              </span>
              <mc-hash [valor]="e.hash" etiqueta="hash del evento" />
            </li>
          }
        </ol>
      }
    </article>
  `,
  styles: `
    .resultado {
      display: grid;
      gap: 8px;
      padding: 16px;
      background: var(--mc-superficie);
      border: 1px solid var(--mc-borde);
      border-radius: var(--mc-radio-tarjeta);
    }
    h3 {
      margin: 0;
    }
    p {
      margin: 0;
    }
    .secundario {
      color: var(--mc-texto-secundario);
    }
    .aviso {
      color: var(--mc-atencion);
      font-weight: 600;
    }
    .linea {
      display: grid;
      gap: 0;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .linea li {
      display: grid;
      grid-template-columns: 56px 1fr auto;
      gap: 12px;
      align-items: center;
      padding: 8px 0;
      border-top: 1px solid var(--mc-borde);
    }
    .numero {
      font-family: var(--mc-fuente-codigo);
      color: var(--mc-texto-secundario);
    }
    .que {
      display: grid;
    }
  `,
})
export class ResultadoRecorrido {
  /** Una coincidencia de la búsqueda. */
  readonly resultado = input.required<ResultadoRecorridoDto>();

  protected readonly rotuloTipo = ROTULO_TIPO_CODIGO_BUSCADO;
  protected readonly rotuloEvento = ROTULO_TIPO_EVENTO;
  protected readonly rotuloEntidad = rotuloEntidad;
}
