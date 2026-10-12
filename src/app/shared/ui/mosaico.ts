import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Tono } from '../estados/catalogo-estados';

/** Estado de carga de un valor. */
export type EstadoCarga = 'cargando' | 'listo' | 'error';

/** Mosaico de un número con su etiqueta (tablero). Si el valor falla, muestra "—" sin afectar a otros mosaicos. */
@Component({
  selector: 'mc-mosaico',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="etiqueta">{{ etiqueta() }}</span>
    <span class="valor" [attr.aria-busy]="estado() === 'cargando'">
      {{ texto() }}
      @if (estado() === 'error') {
        <span class="solo-lectores">no disponible</span>
      }
    </span>
  `,
  host: { '[class]': '"tono-" + (tono() ?? "ninguno")' },
  styles: `
    :host {
      display: grid;
      gap: 2px;
      padding: 14px 16px;
      background: var(--mc-superficie);
      border: 1px solid var(--mc-borde);
      border-radius: var(--mc-radio-tarjeta);
    }
    .etiqueta {
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--mc-texto-secundario);
    }
    .valor {
      font-family: var(--mc-fuente-titulos);
      font-size: 1.7rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    :host(.tono-atencion) { background: var(--mc-atencion-suave); border-color: var(--mc-atencion); }
    :host(.tono-atencion) .valor { color: var(--mc-atencion); }
    :host(.tono-critico) { background: var(--mc-critico-suave); border-color: var(--mc-critico); }
    :host(.tono-critico) .valor { color: var(--mc-critico); }
    .solo-lectores {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  `,
})
export class Mosaico {
  readonly etiqueta = input.required<string>();
  /** Número a mostrar; null mientras no hay valor. */
  readonly valor = input<number | null>(null);
  readonly estado = input<EstadoCarga>('listo');
  /** Tono que resalta el mosaico (por ejemplo "atencion" si hay algo pendiente). */
  readonly tono = input<Tono | null>(null);

  protected readonly texto = computed(() => {
    if (this.estado() === 'error') {
      return '—';
    }
    const valor = this.valor();
    return this.estado() === 'cargando' || valor === null ? '…' : valor.toLocaleString('es-AR');
  });
}
