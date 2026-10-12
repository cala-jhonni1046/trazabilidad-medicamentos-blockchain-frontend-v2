import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { proveerOpcionesMaterial } from '../../core/tema/opciones-material';
import { leerCodigoPegado } from '../escaner/parser-gs1';

/** GTIN y serie leídos de un código. */
export interface CodigoLeido {
  readonly gtin: string;
  readonly serie: string;
}

/**
 * Campo "Pegar el código completo": reconoce un código GS1 (DataMatrix, con o sin paréntesis,
 * como lo tipea una pistola USB) o "GTIN serie" y emite `leido` con los dos datos. No valida el
 * dígito verificador ni la serie: eso lo decide la API. Se lee al pegar y al terminar de tipear.
 */
@Component({
  selector: 'mc-campo-codigo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatInputModule],
  providers: [...proveerOpcionesMaterial()],
  template: `
    <mat-form-field>
      <mat-label>Pegar el código completo (opcional)</mat-label>
      <input matInput autocomplete="off" spellcheck="false" (change)="leer($event)" (input)="alEscribir($event)" />
      <mat-hint>El código del DataMatrix, o "GTIN serie"</mat-hint>
    </mat-form-field>
    @if (aviso(); as a) {
      <p class="aviso" [class.error]="!a.correcto" role="status">{{ a.texto }}</p>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    mat-form-field {
      width: 100%;
    }
    .aviso {
      margin: 0 0 8px;
      color: var(--mc-correcto);
      font-weight: 600;
    }
    .aviso.error {
      color: var(--mc-critico);
    }
  `,
})
export class CampoCodigo {
  /** Se emite con el GTIN y la serie cuando se reconoce un código. */
  readonly leido = output<CodigoLeido>();

  protected readonly aviso = signal<{ correcto: boolean; texto: string } | null>(null);

  protected alEscribir(evento: Event): void {
    if ((evento as InputEvent).inputType === 'insertFromPaste') {
      this.leer(evento);
    }
  }

  protected leer(evento: Event): void {
    const entrada = evento.target as HTMLInputElement;
    if (entrada.value.trim() === '') {
      this.aviso.set(null);
      return;
    }
    const codigo = leerCodigoPegado(entrada.value);
    if (codigo === null) {
      this.aviso.set({ correcto: false, texto: 'No pudimos leer este código. Completá el GTIN y la serie a mano.' });
      return;
    }
    this.leido.emit(codigo);
    this.aviso.set({ correcto: true, texto: 'Código leído: completamos el GTIN y la serie.' });
    entrada.value = '';
  }
}
