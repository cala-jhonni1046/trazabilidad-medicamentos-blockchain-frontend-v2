import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { Icono } from './icono';

/**
 * Un hash (o id largo) en JetBrains Mono, abreviado, con el valor completo disponible
 * (atributo `title`) y un botón para copiarlo. `<mc-hash [valor]="evento.hash" />`.
 */
@Component({
  selector: 'mc-hash',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icono],
  template: `
    <code [attr.title]="valor()">{{ abreviado() }}</code>
    <button type="button" class="copiar" [attr.aria-label]="'Copiar ' + (etiqueta() ?? 'el valor')" (click)="copiar()">
      <mc-icono [nombre]="copiado() ? 'check_circle' : 'content_copy'" />
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
      gap: 4px;
      align-items: center;
      color: var(--mc-texto-secundario);
    }
    .copiar {
      display: inline-flex;
      padding: 2px;
      border: 0;
      background: none;
      color: inherit;
      cursor: pointer;
      border-radius: 4px;
    }
    .copiar:hover {
      color: var(--mc-primario);
    }
  `,
})
export class Hash {
  /** Valor completo. */
  readonly valor = input.required<string>();
  /** Qué es, para el nombre accesible del botón ("el hash", "la transacción"). */
  readonly etiqueta = input<string | null>(null);
  /** Cuántos caracteres se muestran al principio y al final. */
  readonly extremos = input(8);

  protected readonly copiado = signal(false);

  protected readonly abreviado = computed(() => {
    const valor = this.valor();
    const n = this.extremos();
    return valor.length <= n * 2 + 1 ? valor : `${valor.slice(0, n)}…${valor.slice(-n)}`;
  });

  /** Copia el valor completo al portapapeles (si el navegador lo permite). */
  protected async copiar(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.valor());
      this.copiado.set(true);
      setTimeout(() => this.copiado.set(false), 1500);
    } catch {
      // Sin permiso de portapapeles: el valor completo sigue disponible en el title.
    }
  }
}
