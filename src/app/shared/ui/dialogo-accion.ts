import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { firstValueFrom } from 'rxjs';
import { Resultado } from '../../core/api/resultado';
import { ErrorApi } from '../../core/errores/error-api';
import { proveerOpcionesMaterial } from '../../core/tema/opciones-material';
import { ErrorApiComponente } from './error-api';

/** Campo de texto del diálogo (motivo, fundamento, conclusión…). */
export interface CampoDialogo {
  readonly etiqueta: string;
  readonly ayuda?: string;
  /** Por defecto es obligatorio. */
  readonly obligatorio?: boolean;
  /** Filas del cuadro de texto. */
  readonly filas?: number;
}

/** Lista desplegable del diálogo (por ejemplo el motivo de una cuarentena). */
export interface SelectorDialogo {
  readonly etiqueta: string;
  readonly opciones: readonly { readonly valor: string; readonly texto: string }[];
}

/** Lo que se le pasa al diálogo de acción. */
export interface DatosDialogoAccion {
  readonly titulo: string;
  /** Qué se está por hacer y sobre qué (por ejemplo "Farmacia Sur · Salta"). */
  readonly detalle?: string;
  /** Texto adicional (por ejemplo el costo estimado de un anclaje). */
  readonly aviso?: string;
  /** Si hay campo, el diálogo pide un texto; si no, es una simple confirmación. */
  readonly campo?: CampoDialogo;
  /** Lista desplegable obligatoria (se elige antes de confirmar). */
  readonly selector?: SelectorDialogo;
  /** Texto del botón que confirma ("Suspender", "Anclar ahora"…). */
  readonly boton: string;
  /** Realiza la acción; la API decide si corresponde. Recibe el texto escrito (o '') y la opción elegida (o ''). */
  readonly accion: (texto: string, seleccion: string) => Promise<Resultado<unknown>>;
}

/**
 * Diálogo genérico para una acción que modifica datos: confirma, o pide un texto (motivo,
 * fundamento, conclusión) y llama a `accion`. Si la API rechaza la acción (404, 409…), el
 * error se muestra TAL CUAL dentro del diálogo y no se cierra; si la acepta, se cierra con `true`.
 */
@Component({
  selector: 'mc-dialogo-accion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ErrorApiComponente, FormField, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  providers: [...proveerOpcionesMaterial()],
  template: `
    <h2 mat-dialog-title>{{ datos.titulo }}</h2>
    <form novalidate (submit)="confirmar($event)">
      <mat-dialog-content>
        @if (datos.detalle) {
          <p class="detalle">{{ datos.detalle }}</p>
        }
        @if (datos.aviso) {
          <p class="aviso">{{ datos.aviso }}</p>
        }
        <mc-error-api [error]="error()" />
        @if (datos.selector; as selector) {
          <mat-form-field>
            <mat-label>{{ selector.etiqueta }}</mat-label>
            <mat-select [formField]="formulario.seleccion">
              @for (opcion of selector.opciones; track opcion.valor) {
                <mat-option [value]="opcion.valor">{{ opcion.texto }}</mat-option>
              }
            </mat-select>
            @for (e of formulario.seleccion().errors(); track $index) {
              <mat-error>{{ e.message }}</mat-error>
            }
          </mat-form-field>
        }
        @if (datos.campo; as campo) {
          <mat-form-field>
            <mat-label>{{ campo.etiqueta }}</mat-label>
            <textarea matInput [rows]="campo.filas ?? 3" [formField]="formulario.texto"></textarea>
            @if (campo.ayuda) {
              <mat-hint>{{ campo.ayuda }}</mat-hint>
            }
            @for (e of formulario.texto().errors(); track $index) {
              <mat-error>{{ e.message }}</mat-error>
            }
          </mat-form-field>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-flat-button type="submit" [disabled]="formulario().submitting()">
          {{ formulario().submitting() ? 'Procesando…' : datos.boton }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .detalle,
    .aviso {
      margin: 0 0 12px;
    }
    .detalle {
      color: var(--mc-texto-secundario);
    }
    .aviso {
      font-weight: 600;
    }
    mat-form-field {
      width: 100%;
    }
  `,
})
export class DialogoAccion {
  protected readonly datos = inject<DatosDialogoAccion>(MAT_DIALOG_DATA);
  private readonly referencia = inject<MatDialogRef<DialogoAccion, boolean>>(MatDialogRef);

  private readonly modelo = signal({ texto: '', seleccion: '' });

  protected readonly formulario = form(this.modelo, (campos) => {
    if (this.datos.campo !== undefined && this.datos.campo.obligatorio !== false) {
      required(campos.texto, { message: `Completá: ${this.datos.campo.etiqueta.toLowerCase()}.` });
    }
    if (this.datos.selector !== undefined) {
      required(campos.seleccion, { message: `Elegí: ${this.datos.selector.etiqueta.toLowerCase()}.` });
    }
  });

  /** Error de la API al realizar la acción, mostrado tal cual. */
  protected readonly error = signal<ErrorApi | null>(null);

  protected confirmar(evento: Event): void {
    evento.preventDefault();
    this.error.set(null);
    void submit(this.formulario, async () => {
      const resultado = await this.datos.accion(this.modelo().texto.trim(), this.modelo().seleccion);
      if (resultado.ok) {
        this.referencia.close(true);
      } else {
        this.error.set(resultado.error);
      }
      return undefined;
    });
  }
}

/** Abre el diálogo de acción y devuelve true si la acción se realizó. */
export async function abrirDialogoAccion(dialogo: MatDialog, datos: DatosDialogoAccion): Promise<boolean> {
  const referencia = dialogo.open<DialogoAccion, DatosDialogoAccion, boolean>(DialogoAccion, {
    data: datos,
    width: 'min(520px, 95vw)',
  });
  return (await firstValueFrom(referencia.afterClosed())) === true;
}
