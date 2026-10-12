import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { PreferenciaTema, TemaService, esPreferenciaTema } from './tema.service';

/** Opción del selector: valor de la preferencia y texto visible. */
interface OpcionTema {
  readonly valor: PreferenciaTema;
  readonly texto: string;
}

/** Selector del tema de colores: Claro, Oscuro o Sistema. */
@Component({
  selector: 'mc-selector-tema',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonToggleModule],
  template: `
    <mat-button-toggle-group
      aria-label="Tema de colores"
      hideSingleSelectionIndicator
      [value]="tema.preferencia()"
      (change)="cambiar($event)"
    >
      @for (opcion of opciones; track opcion.valor) {
        <mat-button-toggle [value]="opcion.valor">{{ opcion.texto }}</mat-button-toggle>
      }
    </mat-button-toggle-group>
  `,
})
export class SelectorTema {
  protected readonly tema = inject(TemaService);

  protected readonly opciones: readonly OpcionTema[] = [
    { valor: 'claro', texto: 'Claro' },
    { valor: 'oscuro', texto: 'Oscuro' },
    { valor: 'sistema', texto: 'Sistema' },
  ];

  /** Aplica la opción elegida (el valor del evento de Material no tiene tipo: se valida). */
  protected cambiar(evento: MatButtonToggleChange): void {
    const valor: unknown = evento.value;
    if (esPreferenciaTema(valor)) {
      this.tema.cambiarPreferencia(valor);
    }
  }
}
