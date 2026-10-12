import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ErrorApi } from '../../core/errores/error-api';

/**
 * Muestra un error de la API junto a la acción que lo causó: el mensaje del backend tal cual
 * y, si es un 409, el código de la regla incumplida (R11, TRANSICION_INVALIDA…).
 * Sin error, no muestra nada. Se anuncia a los lectores de pantalla (role="alert").
 */
@Component({
  selector: 'mc-error-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (error(); as e) {
      <div class="error" role="alert">
        @if (e.regla) {
          <code class="regla">{{ e.regla }}</code>
        }
        <span>{{ e.mensaje }}</span>
      </div>
    }
  `,
  styles: `
    .error {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: baseline;
      padding: 10px 14px;
      background: var(--mc-critico-suave);
      color: var(--mc-critico);
      border: 1px solid var(--mc-critico);
      border-radius: var(--mc-radio-control);
      font-weight: 600;
    }
    .regla {
      padding: 1px 8px;
      border: 1px solid currentColor;
      border-radius: var(--mc-radio-pastilla);
    }
  `,
})
export class ErrorApiComponente {
  /** Error a mostrar, o null. */
  readonly error = input<ErrorApi | null>(null);
}
