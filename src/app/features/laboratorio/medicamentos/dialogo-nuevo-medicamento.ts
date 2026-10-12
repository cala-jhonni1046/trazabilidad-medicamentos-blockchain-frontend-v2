import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormField, form, required, submit, ValidationError } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MedicamentosService } from '../../../core/api/generado/services/medicamentos.service';
import { MedicamentoRequestDto } from '../../../core/api/modelos';
import { aResultado } from '../../../core/api/resultado';
import { ErrorApi } from '../../../core/errores/error-api';
import { proveerOpcionesMaterial } from '../../../core/tema/opciones-material';
import { ErrorApiComponente } from '../../../shared/ui/error-api';

interface DatosMedicamento {
  gtin: string;
  nombreComercial: string;
  principioActivo: string;
  concentracion: string;
  formaFarmaceutica: string;
  presentacion: string;
  temperaturaMinima: string;
  temperaturaMaxima: string;
  biologico: boolean;
}

const CAMPOS: readonly string[] = [
  'gtin', 'nombreComercial', 'principioActivo', 'concentracion', 'formaFarmaceutica', 'presentacion', 'temperaturaMinima', 'temperaturaMaxima',
];

/**
 * Alta de un medicamento en el catálogo del laboratorio. El GTIN y el resto se validan en la API
 * (R3): sus errores 400 van al campo, y los 409 (MEDICAMENTO_DUPLICADO…) arriba, tal cual.
 */
@Component({
  selector: 'mc-dialogo-nuevo-medicamento',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ErrorApiComponente, FormField, MatButtonModule, MatCheckboxModule, MatDialogModule, MatFormFieldModule, MatInputModule],
  providers: [...proveerOpcionesMaterial()],
  template: `
    <h2 mat-dialog-title>Registrar un medicamento</h2>
    <form novalidate (submit)="enviar($event)">
      <mat-dialog-content>
        <mc-error-api [error]="errorGeneral()" />
        <div class="campos">
          <mat-form-field>
            <mat-label>GTIN</mat-label>
            <input matInput inputmode="numeric" autocomplete="off" [formField]="formulario.gtin" />
            <mat-hint>14 dígitos</mat-hint>
            @for (e of formulario.gtin().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Nombre comercial</mat-label>
            <input matInput autocomplete="off" [formField]="formulario.nombreComercial" />
            @for (e of formulario.nombreComercial().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Principio activo</mat-label>
            <input matInput autocomplete="off" [formField]="formulario.principioActivo" />
            @for (e of formulario.principioActivo().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Concentración</mat-label>
            <input matInput autocomplete="off" [formField]="formulario.concentracion" />
            @for (e of formulario.concentracion().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Forma farmacéutica</mat-label>
            <input matInput autocomplete="off" [formField]="formulario.formaFarmaceutica" />
            @for (e of formulario.formaFarmaceutica().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Presentación</mat-label>
            <input matInput autocomplete="off" [formField]="formulario.presentacion" />
            @for (e of formulario.presentacion().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Temperatura mínima (°C)</mat-label>
            <input matInput inputmode="decimal" autocomplete="off" [formField]="formulario.temperaturaMinima" />
            @for (e of formulario.temperaturaMinima().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Temperatura máxima (°C)</mat-label>
            <input matInput inputmode="decimal" autocomplete="off" [formField]="formulario.temperaturaMaxima" />
            @for (e of formulario.temperaturaMaxima().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
          </mat-form-field>
        </div>
        <mat-checkbox [formField]="formulario.biologico">Es un biológico (lo libera un inspector)</mat-checkbox>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-flat-button type="submit" [disabled]="formulario().submitting()">
          {{ formulario().submitting() ? 'Guardando…' : 'Registrar' }}
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
export class DialogoNuevoMedicamento {
  private readonly api = inject(MedicamentosService);
  private readonly referencia = inject<MatDialogRef<DialogoNuevoMedicamento, boolean>>(MatDialogRef);

  private readonly modelo = signal<DatosMedicamento>({
    gtin: '', nombreComercial: '', principioActivo: '', concentracion: '', formaFarmaceutica: '', presentacion: '',
    temperaturaMinima: '', temperaturaMaxima: '', biologico: false,
  });

  protected readonly formulario = form(this.modelo, (c) => {
    required(c.gtin, { message: 'Escribí el GTIN.' });
    required(c.nombreComercial, { message: 'Escribí el nombre comercial.' });
    required(c.principioActivo, { message: 'Escribí el principio activo.' });
    required(c.concentracion, { message: 'Escribí la concentración.' });
    required(c.formaFarmaceutica, { message: 'Escribí la forma farmacéutica.' });
    required(c.presentacion, { message: 'Escribí la presentación.' });
  });

  protected readonly errorGeneral = signal<ErrorApi | null>(null);

  protected enviar(evento: Event): void {
    evento.preventDefault();
    this.errorGeneral.set(null);
    void submit(this.formulario, async () => {
      const m = this.modelo();
      const cuerpo: MedicamentoRequestDto = {
        gtin: m.gtin.trim(),
        nombreComercial: m.nombreComercial.trim(),
        principioActivo: m.principioActivo.trim(),
        concentracion: m.concentracion.trim(),
        formaFarmaceutica: m.formaFarmaceutica.trim(),
        presentacion: m.presentacion.trim(),
        biologico: m.biologico,
        // Un vacío no se manda (el rango térmico es opcional); la API valida el número.
        ...(m.temperaturaMinima.trim() === '' ? {} : { temperaturaMinima: Number(m.temperaturaMinima.replace(',', '.')) }),
        ...(m.temperaturaMaxima.trim() === '' ? {} : { temperaturaMaxima: Number(m.temperaturaMaxima.replace(',', '.')) }),
      };
      const resultado = await aResultado(this.api.registrarMedicamento({ body: cuerpo }));
      if (resultado.ok) {
        this.referencia.close(true);
        return undefined;
      }
      return this.repartir(resultado.error);
    });
  }

  private repartir(error: ErrorApi): ValidationError.WithFieldTree[] {
    const deCampo: ValidationError.WithFieldTree[] = [];
    for (const campo of error.campos) {
      const nombre = campo.field.split('.').pop() as keyof DatosMedicamento;
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
