import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, output, signal } from '@angular/core';
import { FormField, form, required, submit, ValidationError } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { VerificacionPublicaResponseDto } from '../../../core/api/modelos';
import { ErrorApi } from '../../../core/errores/error-api';
import { proveerOpcionesMaterial } from '../../../core/tema/opciones-material';
import { CampoCodigo, CodigoLeido } from '../../../shared/ui/campo-codigo';
import { Icono } from '../../../shared/ui/icono';
import { ErrorApiComponente } from '../../../shared/ui/error-api';
import { ResultadoVerificacion } from './resultado-verificacion';
import { VerificarDatos } from './verificar.datos';

/** Datos que escribe la persona. */
interface DatosCaja {
  gtin: string;
  serie: string;
}

/**
 * Verificación pública de una caja por GTIN + serie. No necesita sesión y NO pide ni muestra
 * datos de pacientes (R13). Atajo: "Pegar el código completo" reparte un código GS1 (o
 * "GTIN serie") en los dos campos. El formato y los dígitos los valida la API: sus errores
 * 400 se muestran en cada campo, y el mensaje del resultado se muestra tal cual.
 */
@Component({
  selector: 'mc-verificar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CampoCodigo, ErrorApiComponente, FormField, Icono, MatButtonModule, MatFormFieldModule, MatInputModule, ResultadoVerificacion],
  providers: [VerificarDatos, ...proveerOpcionesMaterial()],
  templateUrl: './verificar.html',
  styleUrl: './verificar.scss',
})
export class Verificar {
  private readonly datos = inject(VerificarDatos);
  private readonly documento = inject(DOCUMENT);

  /** Se emite con el GTIN y la serie de la caja cada vez que la verificación responde (por ejemplo, para ofrecer reportarla). */
  readonly consultada = output<{ gtin: string; serie: string }>();

  private readonly modelo = signal<DatosCaja>({ gtin: '', serie: '' });

  /** Formulario: GTIN y serie obligatorios (el resto lo valida la API). */
  protected readonly formulario = form(this.modelo, (campos) => {
    required(campos.gtin, { message: 'Escribí el GTIN de la caja.' });
    required(campos.serie, { message: 'Escribí el número de serie de la caja.' });
  });

  /** Respuesta de la última verificación. */
  protected readonly resultado = signal<VerificacionPublicaResponseDto | null>(null);

  /** Error de la API que no corresponde a un campo. */
  protected readonly errorGeneral = signal<ErrorApi | null>(null);


  constructor() {
    // Al aparecer un resultado, el foco pasa a su título: quien usa lector de pantalla lo escucha.
    effect(() => {
      if (this.resultado() !== null) {
        queueMicrotask(() => this.documento.getElementById('titulo-resultado')?.focus());
      }
    });
  }

  /** Completa GTIN y serie con lo leído de un código (pegado, tipeado o escaneado con la cámara). */
  protected alLeer(codigo: CodigoLeido): void {
    this.modelo.set({ gtin: codigo.gtin, serie: codigo.serie });
  }

  /** Envía la consulta. */
  protected verificar(evento: Event): void {
    evento.preventDefault();
    this.errorGeneral.set(null);
    this.resultado.set(null);
    void submit(this.formulario, async () => {
      const { gtin, serie } = this.modelo();
      const respuesta = await this.datos.verificar(gtin.trim(), serie.trim());
      if (respuesta.ok) {
        this.resultado.set(respuesta.valor);
        this.consultada.emit({ gtin: respuesta.valor.gtin, serie: respuesta.valor.serie });
        return undefined;
      }
      return this.repartirError(respuesta.error);
    });
  }

  /** Los errores 400 por campo van a su campo; el resto, arriba del formulario. */
  private repartirError(error: ErrorApi): ValidationError.WithFieldTree[] {
    const deCampo: ValidationError.WithFieldTree[] = [];
    for (const campo of error.campos) {
      const nombre = campo.field.split('.').pop();
      if (nombre === 'gtin' || nombre === 'serie') {
        deCampo.push({ kind: 'servidor', message: campo.message, fieldTree: this.formulario[nombre] });
      }
    }
    if (deCampo.length === 0) {
      this.errorGeneral.set(error);
    }
    return deCampo;
  }
}
