import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { proveerOpcionesMaterial } from '../../core/tema/opciones-material';

/** Una opción del filtro. */
export interface OpcionFiltro<V extends string> {
  readonly valor: V;
  readonly texto: string;
}

/**
 * Filtro por estado para los listados: una lista desplegable con "Todos" y las opciones dadas.
 * El valor `null` significa "sin filtro". `<mc-filtro-estado [opciones]="…" (cambio)="…" />`.
 */
@Component({
  selector: 'mc-filtro-estado',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatSelectModule],
  providers: [...proveerOpcionesMaterial()],
  template: `
    <mat-form-field subscriptSizing="dynamic">
      <mat-label>{{ etiqueta() }}</mat-label>
      <mat-select [value]="valor()" (selectionChange)="cambio.emit($event.value)">
        <mat-option [value]="null">Todos</mat-option>
        @for (opcion of opciones(); track opcion.valor) {
          <mat-option [value]="opcion.valor">{{ opcion.texto }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
  styles: `
    :host {
      display: block;
      min-width: 200px;
    }
  `,
})
export class FiltroEstado<V extends string = string> {
  readonly etiqueta = input('Estado');
  readonly opciones = input.required<readonly OpcionFiltro<V>[]>();
  readonly valor = input<V | null>(null);
  readonly cambio = output<V | null>();
}
