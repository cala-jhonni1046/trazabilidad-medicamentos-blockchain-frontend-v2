import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormField, form, required, submit, ValidationError } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ReportesCiudadanosService } from '../../../core/api/generado/services/reportes-ciudadanos.service';
import { MOTIVO_REPORTE, MotivoReporte, PROVINCIA, Provincia, ReporteCiudadanoResponseDto } from '../../../core/api/modelos';
import { aResultado } from '../../../core/api/resultado';
import { ErrorApi } from '../../../core/errores/error-api';
import { proveerOpcionesMaterial } from '../../../core/tema/opciones-material';
import { ROTULO_MOTIVO_REPORTE, ROTULO_PROVINCIA } from '../../../shared/formato/etiquetas';
import { CampoCodigo, CodigoLeido } from '../../../shared/ui/campo-codigo';
import { ErrorApiComponente } from '../../../shared/ui/error-api';
import { Tarjeta } from '../../../shared/ui/tarjeta';

interface DatosReporte {
  gtin: string;
  serie: string;
  motivo: MotivoReporte | '';
  provincia: Provincia | '';
  descripcion: string;
}

const CAMPOS: readonly string[] = ['gtin', 'serie', 'motivo', 'provincia', 'descripcion'];

/**
 * El paciente reporta una caja (aunque no exista: puede ser una falsificación). La descripción
 * queda solo en su reporte, nunca en la cadena. Un inspector de la provincia indicada lo investiga.
 */
@Component({
  selector: 'mc-formulario-reporte',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CampoCodigo, ErrorApiComponente, FormField, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, Tarjeta],
  providers: [...proveerOpcionesMaterial()],
  templateUrl: './formulario-reporte.html',
  styles: `
    .campos {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 0 12px;
    }
    mat-form-field.ancho {
      width: 100%;
    }
    .confirmacion {
      margin-top: 12px;
      padding: 12px 14px;
      background: var(--mc-correcto-suave);
      color: var(--mc-correcto);
      border: 1px solid var(--mc-correcto);
      border-radius: var(--mc-radio-control);
      font-weight: 600;
    }
  `,
})
export class FormularioReporte {
  private readonly api = inject(ReportesCiudadanosService);

  /** GTIN y serie de la última caja verificada: se completan solos (se pueden cambiar). */
  readonly codigo = input<CodigoLeido | null>(null);
  /** Se emite al crear el reporte. */
  readonly reportado = output<ReporteCiudadanoResponseDto>();

  protected readonly motivos = MOTIVO_REPORTE.map((valor) => ({ valor, texto: ROTULO_MOTIVO_REPORTE[valor] }));
  protected readonly provincias = PROVINCIA.map((valor) => ({ valor, texto: ROTULO_PROVINCIA[valor] }));

  private readonly modelo = signal<DatosReporte>({ gtin: '', serie: '', motivo: '', provincia: '', descripcion: '' });

  protected readonly formulario = form(this.modelo, (c) => {
    required(c.gtin, { message: 'Escribí el GTIN de la caja.' });
    required(c.serie, { message: 'Escribí el número de serie de la caja.' });
    required(c.motivo, { message: 'Elegí qué pasó.' });
    required(c.provincia, { message: 'Elegí la provincia donde la conseguiste.' });
  });

  protected readonly errorGeneral = signal<ErrorApi | null>(null);
  protected readonly creado = signal<ReporteCiudadanoResponseDto | null>(null);

  constructor() {
    // Cuando se verifica una caja, sus datos pasan al reporte.
    effect(() => {
      const codigo = this.codigo();
      if (codigo !== null) {
        untracked(() => this.modelo.update((m) => ({ ...m, gtin: codigo.gtin, serie: codigo.serie })));
      }
    });
  }

  protected alLeer(codigo: CodigoLeido): void {
    this.modelo.update((m) => ({ ...m, gtin: codigo.gtin, serie: codigo.serie }));
  }

  protected enviar(evento: Event): void {
    evento.preventDefault();
    this.errorGeneral.set(null);
    this.creado.set(null);
    void submit(this.formulario, async () => {
      const m = this.modelo();
      const resultado = await aResultado(
        this.api.reportarCaja({
          body: {
            gtin: m.gtin.trim(),
            serie: m.serie.trim(),
            motivo: m.motivo as MotivoReporte,
            provincia: m.provincia as Provincia,
            ...(m.descripcion.trim() === '' ? {} : { descripcion: m.descripcion.trim() }),
          },
        }),
      );
      if (resultado.ok) {
        this.creado.set(resultado.valor);
        this.modelo.set({ gtin: '', serie: '', motivo: '', provincia: '', descripcion: '' });
        this.formulario().reset();
        this.reportado.emit(resultado.valor);
        return undefined;
      }
      return this.repartir(resultado.error);
    });
  }

  private repartir(error: ErrorApi): ValidationError.WithFieldTree[] {
    const deCampo: ValidationError.WithFieldTree[] = [];
    for (const campo of error.campos) {
      const nombre = campo.field.split('.').pop() as keyof DatosReporte;
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
