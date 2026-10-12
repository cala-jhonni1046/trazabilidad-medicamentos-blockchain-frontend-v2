import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatearFechaHora } from '../formato/fechas';

/** Una lectura del sensor. */
export interface LecturaTemperatura {
  readonly fechaHora: string;
  readonly temperatura: number;
  /** Lo decide el backend contra el rango del medicamento (R9). */
  readonly fueraDeRango: boolean;
}

const ANCHO = 640;
const ALTO = 180;
const MARGEN_IZQ = 44;
const MARGEN = 16;

/**
 * Gráfico de línea de las temperaturas de un viaje. Las lecturas fuera de rango (según el
 * backend) van en color crítico y con otra forma. Tiene un resumen para lectores de pantalla y
 * una tabla desplegable con todos los valores, así no depende solo del color.
 */
@Component({
  selector: 'mc-grafico-temperatura',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (lecturas().length === 0) {
      <p class="vacio">Todavía no hay lecturas de temperatura.</p>
    } @else {
      <svg [attr.viewBox]="'0 0 ' + ancho + ' ' + alto" role="img" [attr.aria-label]="resumen()" class="grafico">
        <line class="eje" [attr.x1]="margenIzq" [attr.y1]="margen" [attr.x2]="margenIzq" [attr.y2]="alto - margen" />
        <line class="eje" [attr.x1]="margenIzq" [attr.y1]="alto - margen" [attr.x2]="ancho - margen" [attr.y2]="alto - margen" />
        <text class="etiqueta" [attr.x]="margenIzq - 6" [attr.y]="margen + 4" text-anchor="end">{{ maximo().toFixed(1) }}°</text>
        <text class="etiqueta" [attr.x]="margenIzq - 6" [attr.y]="alto - margen" text-anchor="end">{{ minimo().toFixed(1) }}°</text>
        <polyline class="linea" [attr.points]="puntos()" />
        @for (p of marcas(); track $index) {
          @if (p.fuera) {
            <rect class="punto fuera" [attr.x]="p.x - 5" [attr.y]="p.y - 5" width="10" height="10" transform-origin="center" />
          } @else {
            <circle class="punto" [attr.cx]="p.x" [attr.cy]="p.y" r="3.5" />
          }
        }
      </svg>
      <details>
        <summary>Ver las {{ lecturas().length }} lecturas en una tabla</summary>
        <div class="mc-tabla" tabindex="0" role="region" aria-label="Lecturas de temperatura">
          <table>
            <thead><tr><th>Hora</th><th>Temperatura</th><th>Rango</th></tr></thead>
            <tbody>
              @for (l of lecturas(); track $index) {
                <tr>
                  <td>{{ hora(l.fechaHora) }}</td>
                  <td>{{ l.temperatura }} °C</td>
                  <td>{{ l.fueraDeRango ? 'Fuera de rango' : 'En rango' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </details>
    }
  `,
  styles: `
    .grafico {
      display: block;
      width: 100%;
      max-width: 640px;
      height: auto;
    }
    .eje {
      stroke: var(--mc-borde-fuerte);
      stroke-width: 1;
    }
    .etiqueta {
      fill: var(--mc-texto-secundario);
      font-size: 11px;
      font-family: var(--mc-fuente-texto);
    }
    .linea {
      fill: none;
      stroke: var(--mc-transito);
      stroke-width: 2;
    }
    .punto {
      fill: var(--mc-transito);
    }
    .punto.fuera {
      fill: var(--mc-critico);
    }
    .vacio {
      color: var(--mc-texto-secundario);
    }
    details {
      margin-top: 8px;
    }
    summary {
      cursor: pointer;
      color: var(--mc-primario);
      font-weight: 600;
    }
  `,
})
export class GraficoTemperatura {
  readonly lecturas = input.required<readonly LecturaTemperatura[]>();

  protected readonly ancho = ANCHO;
  protected readonly alto = ALTO;
  protected readonly margen = MARGEN;
  protected readonly margenIzq = MARGEN_IZQ;

  protected readonly minimo = computed(() => Math.min(...this.lecturas().map((l) => l.temperatura)) - 1);
  protected readonly maximo = computed(() => Math.max(...this.lecturas().map((l) => l.temperatura)) + 1);

  /** Posición de cada lectura: x repartida por orden (la API las entrega ordenadas por hora), y por temperatura. */
  protected readonly marcas = computed(() => {
    const lecturas = this.lecturas();
    const minimo = this.minimo();
    const rango = this.maximo() - minimo || 1;
    const utilX = ANCHO - MARGEN_IZQ - MARGEN;
    const utilY = ALTO - 2 * MARGEN;
    return lecturas.map((l, i) => ({
      x: MARGEN_IZQ + (lecturas.length === 1 ? utilX / 2 : (i / (lecturas.length - 1)) * utilX),
      y: ALTO - MARGEN - ((l.temperatura - minimo) / rango) * utilY,
      fuera: l.fueraDeRango,
    }));
  });

  protected readonly puntos = computed(() => this.marcas().map((p) => `${p.x},${p.y}`).join(' '));

  protected readonly resumen = computed(() => {
    const lecturas = this.lecturas();
    const temperaturas = lecturas.map((l) => l.temperatura);
    const fuera = lecturas.filter((l) => l.fueraDeRango).length;
    return `Temperatura del viaje: ${lecturas.length} lecturas entre ${Math.min(...temperaturas)} y ${Math.max(...temperaturas)} grados; ${fuera === 0 ? 'ninguna fuera de rango' : `${fuera} fuera de rango`}.`;
  });

  protected hora(instante: string): string {
    return formatearFechaHora(instante);
  }
}
