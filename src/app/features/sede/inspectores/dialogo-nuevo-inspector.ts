import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormField, email, form, required, submit, ValidationError } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PROVINCIA, Provincia } from '../../../core/api/modelos';
import { ErrorApi } from '../../../core/errores/error-api';
import { proveerOpcionesMaterial } from '../../../core/tema/opciones-material';
import { ROTULO_PROVINCIA } from '../../../shared/formato/etiquetas';
import { ErrorApiComponente } from '../../../shared/ui/error-api';
import { InspectoresDatos } from './inspectores.datos';

/** Campos del formulario de alta. */
interface DatosInspector {
  legajo: string;
  dni: string;
  provincia: Provincia | '';
  email: string;
  password: string;
  nombre: string;
  apellido: string;
}

/** Campos que la API puede marcar con error (400). */
const CAMPOS: readonly (keyof DatosInspector)[] = ['legajo', 'dni', 'provincia', 'email', 'password', 'nombre', 'apellido'];

/**
 * Alta de un inspector (solo la Sede, R1). Los errores 400 van a su campo; 409
 * (INSPECTOR_DUPLICADO, etc.) y los demás se muestran tal cual arriba del formulario.
 */
@Component({
  selector: 'mc-dialogo-nuevo-inspector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ErrorApiComponente, FormField, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  providers: [...proveerOpcionesMaterial()],
  template: `
    <h2 mat-dialog-title>Dar de alta un inspector</h2>
    <form novalidate (submit)="enviar($event)">
      <mat-dialog-content>
        <mc-error-api [error]="errorGeneral()" />
        <div class="campos">
          <mat-form-field>
            <mat-label>Nombre</mat-label>
            <input matInput autocomplete="off" [formField]="formulario.nombre" />
            @for (e of formulario.nombre().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Apellido</mat-label>
            <input matInput autocomplete="off" [formField]="formulario.apellido" />
            @for (e of formulario.apellido().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Legajo</mat-label>
            <input matInput autocomplete="off" [formField]="formulario.legajo" />
            @for (e of formulario.legajo().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
          </mat-form-field>
          <mat-form-field>
            <mat-label>DNI</mat-label>
            <input matInput inputmode="numeric" autocomplete="off" [formField]="formulario.dni" />
            @for (e of formulario.dni().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Provincia</mat-label>
            <mat-select [formField]="formulario.provincia">
              @for (p of provincias; track p.valor) { <mat-option [value]="p.valor">{{ p.texto }}</mat-option> }
            </mat-select>
            @for (e of formulario.provincia().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Correo electrónico</mat-label>
            <input matInput type="email" autocomplete="off" [formField]="formulario.email" />
            @for (e of formulario.email().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Contraseña inicial</mat-label>
            <input matInput type="password" autocomplete="new-password" [formField]="formulario.password" />
            @for (e of formulario.password().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
          </mat-form-field>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-flat-button type="submit" [disabled]="formulario().submitting()">
          {{ formulario().submitting() ? 'Guardando…' : 'Dar de alta' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .campos {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 0 12px;
    }
  `,
})
export class DialogoNuevoInspector {
  private readonly datos = inject(InspectoresDatos);
  private readonly referencia = inject<MatDialogRef<DialogoNuevoInspector, boolean>>(MatDialogRef);

  protected readonly provincias = PROVINCIA.map((valor) => ({ valor, texto: ROTULO_PROVINCIA[valor] }));

  private readonly modelo = signal<DatosInspector>({ legajo: '', dni: '', provincia: '', email: '', password: '', nombre: '', apellido: '' });

  protected readonly formulario = form(this.modelo, (c) => {
    required(c.nombre, { message: 'Escribí el nombre.' });
    required(c.apellido, { message: 'Escribí el apellido.' });
    required(c.legajo, { message: 'Escribí el legajo.' });
    required(c.dni, { message: 'Escribí el DNI.' });
    required(c.provincia, { message: 'Elegí la provincia.' });
    required(c.email, { message: 'Escribí el correo electrónico.' });
    email(c.email, { message: 'Escribí un correo con formato válido.' });
    required(c.password, { message: 'Escribí una contraseña inicial.' });
  });

  protected readonly errorGeneral = signal<ErrorApi | null>(null);

  protected enviar(evento: Event): void {
    evento.preventDefault();
    this.errorGeneral.set(null);
    void submit(this.formulario, async () => {
      const m = this.modelo();
      const resultado = await this.datos.crear({
        legajo: m.legajo.trim(),
        dni: m.dni.trim(),
        provincia: m.provincia as Provincia,
        email: m.email.trim(),
        password: m.password,
        nombre: m.nombre.trim(),
        apellido: m.apellido.trim(),
      });
      if (resultado.ok) {
        this.referencia.close(true);
        return undefined;
      }
      return this.repartir(resultado.error);
    });
  }

  /** Errores 400 por campo → a su campo; todo lo demás, arriba del formulario. */
  private repartir(error: ErrorApi): ValidationError.WithFieldTree[] {
    const deCampo: ValidationError.WithFieldTree[] = [];
    for (const campo of error.campos) {
      const nombre = campo.field.split('.').pop() as keyof DatosInspector;
      if (CAMPOS.includes(nombre)) {
        deCampo.push({ kind: 'servidor', message: campo.message, fieldTree: this.formulario[nombre] });
      }
    }
    if (deCampo.length === 0) {
      this.errorGeneral.set(error);
    }
    return deCampo;
  }
}
