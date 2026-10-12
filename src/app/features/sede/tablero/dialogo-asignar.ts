import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Resultado } from '../../../core/api/resultado';
import { ErrorApi } from '../../../core/errores/error-api';
import { proveerOpcionesMaterial } from '../../../core/tema/opciones-material';
import { ROTULO_PROVINCIA } from '../../../shared/formato/etiquetas';
import { ErrorApiComponente } from '../../../shared/ui/error-api';
import { OpcionInspector } from './tablero.datos';

/** Lo que el tablero le pasa al diálogo. */
export interface DatosDialogoAsignar {
  /** Qué se está asignando (por ejemplo "Solicitud de habilitación"). */
  readonly titulo: string;
  /** Detalle del ítem (por ejemplo "Farmacia Sur · Salta"). */
  readonly detalle: string;
  readonly cargarInspectores: () => Promise<Resultado<readonly OpcionInspector[]>>;
  /** Asigna al inspector elegido; la API decide si corresponde. */
  readonly asignar: (inspectorId: string) => Promise<Resultado<unknown>>;
}

/**
 * Diálogo para elegir el inspector de una asignación.
 * Se cierra con el texto del inspector elegido si la API aceptó la asignación; si la API la
 * rechaza (404, 409…), el error se muestra acá adentro y el diálogo sigue abierto.
 */
@Component({
  selector: 'mc-dialogo-asignar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ErrorApiComponente, FormField, MatButtonModule, MatDialogModule, MatFormFieldModule, MatSelectModule],
  providers: [...proveerOpcionesMaterial()],
  templateUrl: './dialogo-asignar.html',
  styleUrl: './dialogo-asignar.scss',
})
export class DialogoAsignar implements OnInit {
  protected readonly datos = inject<DatosDialogoAsignar>(MAT_DIALOG_DATA);
  private readonly referencia = inject<MatDialogRef<DialogoAsignar, string>>(MatDialogRef);

  private readonly modelo = signal({ inspectorId: '' });

  protected readonly formulario = form(this.modelo, (campos) => {
    required(campos.inspectorId, { message: 'Elegí un inspector.' });
  });

  protected readonly inspectores = signal<readonly OpcionInspector[]>([]);
  protected readonly cargando = signal(true);
  /** Error al buscar los inspectores. */
  protected readonly errorCarga = signal<ErrorApi | null>(null);
  /** Error de la API al asignar (404, 409…): se muestra tal cual, dentro del diálogo. */
  protected readonly errorAsignacion = signal<ErrorApi | null>(null);

  async ngOnInit(): Promise<void> {
    const resultado = await this.datos.cargarInspectores();
    if (resultado.ok) {
      this.inspectores.set(resultado.valor);
    } else {
      this.errorCarga.set(resultado.error);
    }
    this.cargando.set(false);
  }

  /** Texto de una opción: "Laura Gómez (L-001) · Mendoza" o, sin nombre, "L-001 · Mendoza". */
  protected etiqueta(inspector: OpcionInspector): string {
    const provincia = ROTULO_PROVINCIA[inspector.provincia];
    return inspector.nombre === null
      ? `${inspector.legajo} · ${provincia}`
      : `${inspector.nombre} (${inspector.legajo}) · ${provincia}`;
  }

  /** Confirma la asignación. */
  protected confirmar(evento: Event): void {
    evento.preventDefault();
    this.errorAsignacion.set(null);
    void submit(this.formulario, async () => {
      const elegido = this.inspectores().find((inspector) => inspector.id === this.modelo().inspectorId);
      const resultado = await this.datos.asignar(this.modelo().inspectorId);
      if (resultado.ok) {
        this.referencia.close(elegido === undefined ? '' : this.etiqueta(elegido));
      } else {
        this.errorAsignacion.set(resultado.error);
      }
      return undefined;
    });
  }
}
