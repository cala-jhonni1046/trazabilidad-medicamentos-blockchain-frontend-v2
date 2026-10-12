import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormField, form, required, submit, ValidationError } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { LotesService } from '../../../core/api/generado/services/lotes.service';
import { MedicamentosService } from '../../../core/api/generado/services/medicamentos.service';
import { LoteRequestDto, MedicamentoResponseDto } from '../../../core/api/modelos';
import { TAMANO_PAGINA_MAXIMO } from '../../../core/api/pagina';
import { aResultado } from '../../../core/api/resultado';
import { ErrorApi } from '../../../core/errores/error-api';
import { proveerOpcionesMaterial } from '../../../core/tema/opciones-material';
import { ErrorApiComponente } from '../../../shared/ui/error-api';

interface DatosLote {
  medicamentoId: string;
  codigo: string;
  fechaFabricacion: string;
  fechaVencimiento: string;
  cantidad: string;
  series: string;
}

const CAMPOS: readonly string[] = ['medicamentoId', 'codigo', 'fechaFabricacion', 'fechaVencimiento', 'cantidad', 'series'];

/**
 * Alta de un lote con todas sus cajas. Se manda UNA de las dos formas que acepta la API: la
 * cantidad (el servidor genera las series) o la lista de series (una por línea). Las reglas de
 * las series (R3), las fechas y el código único (LOTE_DUPLICADO) las decide la API.
 */
@Component({
  selector: 'mc-dialogo-nuevo-lote',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ErrorApiComponente, FormField, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  providers: [...proveerOpcionesMaterial()],
  template: `
    <h2 mat-dialog-title>Registrar un lote</h2>
    <form novalidate (submit)="enviar($event)">
      <mat-dialog-content>
        <mc-error-api [error]="errorGeneral()" />
        @if (cargando()) {
          <p role="status">Buscando tus medicamentos…</p>
        } @else if (medicamentos().length === 0) {
          <p role="status">Primero registrá un medicamento en "Medicamentos".</p>
        } @else {
          <div class="campos">
            <mat-form-field>
              <mat-label>Medicamento</mat-label>
              <mat-select [formField]="formulario.medicamentoId">
                @for (m of medicamentos(); track m.id) {
                  <mat-option [value]="m.id">{{ m.nombreComercial }} · GTIN {{ m.gtin }}</mat-option>
                }
              </mat-select>
              @for (e of formulario.medicamentoId().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
            </mat-form-field>
            <mat-form-field>
              <mat-label>Código del lote</mat-label>
              <input matInput autocomplete="off" [formField]="formulario.codigo" />
              <mat-hint>Hasta 12: letras, números y guion</mat-hint>
              @for (e of formulario.codigo().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
            </mat-form-field>
            <mat-form-field>
              <mat-label>Fecha de fabricación</mat-label>
              <input matInput type="date" [formField]="formulario.fechaFabricacion" />
              @for (e of formulario.fechaFabricacion().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
            </mat-form-field>
            <mat-form-field>
              <mat-label>Fecha de vencimiento</mat-label>
              <input matInput type="date" [formField]="formulario.fechaVencimiento" />
              @for (e of formulario.fechaVencimiento().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
            </mat-form-field>
            <mat-form-field>
              <mat-label>Cantidad de cajas</mat-label>
              <input matInput inputmode="numeric" autocomplete="off" [formField]="formulario.cantidad" />
              <mat-hint>El servidor genera las series (hasta 10.000)</mat-hint>
              @for (e of formulario.cantidad().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
            </mat-form-field>
          </div>
          <mat-form-field class="ancho">
            <mat-label>O bien: series propias (una por línea)</mat-label>
            <textarea matInput rows="3" spellcheck="false" [formField]="formulario.series"></textarea>
            <mat-hint>Si completás las series, dejá vacía la cantidad</mat-hint>
            @for (e of formulario.series().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
          </mat-form-field>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-flat-button type="submit" [disabled]="cargando() || medicamentos().length === 0 || formulario().submitting()">
          {{ formulario().submitting() ? 'Registrando…' : 'Registrar lote' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .campos {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 0 12px;
    }
    .ancho {
      width: 100%;
    }
  `,
})
export class DialogoNuevoLote {
  private readonly lotes = inject(LotesService);
  private readonly medicamentosApi = inject(MedicamentosService);
  private readonly referencia = inject<MatDialogRef<DialogoNuevoLote, boolean>>(MatDialogRef);

  private readonly modelo = signal<DatosLote>({ medicamentoId: '', codigo: '', fechaFabricacion: '', fechaVencimiento: '', cantidad: '', series: '' });

  protected readonly formulario = form(this.modelo, (c) => {
    required(c.medicamentoId, { message: 'Elegí el medicamento.' });
    required(c.codigo, { message: 'Escribí el código del lote.' });
    required(c.fechaFabricacion, { message: 'Elegí la fecha de fabricación.' });
    required(c.fechaVencimiento, { message: 'Elegí la fecha de vencimiento.' });
  });

  protected readonly medicamentos = signal<readonly MedicamentoResponseDto[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorGeneral = signal<ErrorApi | null>(null);

  constructor() {
    void this.cargarMedicamentos();
  }

  private async cargarMedicamentos(): Promise<void> {
    const resultado = await aResultado(this.medicamentosApi.listarMedicamentos({ size: TAMANO_PAGINA_MAXIMO }));
    if (resultado.ok) {
      this.medicamentos.set(resultado.valor.content);
    } else {
      this.errorGeneral.set(resultado.error);
    }
    this.cargando.set(false);
  }

  protected enviar(evento: Event): void {
    evento.preventDefault();
    this.errorGeneral.set(null);
    void submit(this.formulario, async () => {
      const m = this.modelo();
      const series = m.series.split('\n').map((s) => s.trim()).filter((s) => s !== '');
      const cantidad = m.cantidad.trim();
      const cuerpo: LoteRequestDto = {
        medicamentoId: m.medicamentoId,
        codigo: m.codigo.trim(),
        // Las fechas de solo día van como YYYY-MM-DD (lo que entrega <input type="date">).
        fechaFabricacion: m.fechaFabricacion,
        fechaVencimiento: m.fechaVencimiento,
        // Se manda lo que la persona completó; si completó las dos o ninguna, la API responde el 400/409.
        ...(series.length > 0 ? { series } : {}),
        ...(cantidad !== '' ? { cantidad: Number(cantidad) } : {}),
      };
      const resultado = await aResultado(this.lotes.registrarLote({ body: cuerpo }));
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
      const nombre = campo.field.split('.').pop() as keyof DatosLote;
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
