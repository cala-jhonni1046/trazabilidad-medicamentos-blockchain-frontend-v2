import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Panel con título (y detalle opcional) para agrupar contenido: `<mc-tarjeta titulo="…">…</mc-tarjeta>`. */
@Component({
  selector: 'mc-tarjeta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <h2>{{ titulo() }}</h2>
      @if (detalle(); as texto) {
        <span class="detalle">{{ texto }}</span>
      }
    </header>
    <ng-content />
  `,
  styles: `
    :host {
      display: grid;
      gap: 12px;
      align-content: start;
      min-width: 0;
      padding: 18px;
      background: var(--mc-superficie);
      border: 1px solid var(--mc-borde);
      border-radius: var(--mc-radio-tarjeta);
    }
    header {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 12px;
      align-items: baseline;
      justify-content: space-between;
    }
    .detalle {
      color: var(--mc-texto-secundario);
      font-size: 0.875rem;
    }
  `,
})
export class Tarjeta {
  readonly titulo = input.required<string>();
  readonly detalle = input<string | null>(null);
}
