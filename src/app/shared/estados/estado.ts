import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icono } from '../ui/icono';
import { PresentacionEstado } from './catalogo-estados';

/**
 * Etiqueta de un estado: ícono + texto sobre el color suave del tono.
 * Recibe la presentación ya resuelta desde el catálogo: `<mc-estado [presentacion]="…" />`.
 */
@Component({
  selector: 'mc-estado',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icono],
  template: `<mc-icono [nombre]="presentacion().icono" />{{ presentacion().texto }}`,
  host: { '[class]': '"tono-" + presentacion().tono' },
  styles: `
    :host {
      display: inline-flex;
      gap: 4px;
      align-items: center;
      padding: 2px 10px 2px 6px;
      border-radius: var(--mc-radio-pastilla);
      font-size: 0.8125rem;
      font-weight: 700;
      white-space: nowrap;
    }
    :host(.tono-correcto) { background: var(--mc-correcto-suave); color: var(--mc-correcto); }
    :host(.tono-atencion) { background: var(--mc-atencion-suave); color: var(--mc-atencion); }
    :host(.tono-critico) { background: var(--mc-critico-suave); color: var(--mc-critico); }
    :host(.tono-transito) { background: var(--mc-transito-suave); color: var(--mc-transito); }
    :host(.tono-blockchain) { background: var(--mc-blockchain-suave); color: var(--mc-blockchain); }
    :host(.tono-neutro) { background: var(--mc-neutro-suave); color: var(--mc-neutro); }
  `,
})
export class Estado {
  /** Presentación del estado (texto, tono e ícono). */
  readonly presentacion = input.required<PresentacionEstado>();
}
