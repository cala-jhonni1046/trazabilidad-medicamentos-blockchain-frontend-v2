import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormField, form, required, submit, ValidationError } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RecepcionesService } from '../../../core/api/generado/services/recepciones.service';
import { RecepcionResponseDto } from '../../../core/api/modelos';
import { aResultado } from '../../../core/api/resultado';
import { ErrorApi } from '../../../core/errores/error-api';
import { proveerOpcionesMaterial } from '../../../core/tema/opciones-material';
import { PRESENTACION_RECEPCION } from '../../../shared/estados/catalogo-estados';
import { Estado } from '../../../shared/estados/estado';
import { ErrorApiComponente } from '../../../shared/ui/error-api';
import { Tarjeta } from '../../../shared/ui/tarjeta';

interface DatosRecepcion {
  codigoBulto: string;
  precintoIntacto: boolean;
  cantidadVerificada: string;
  temperatura: string;
  observacion: string;
}

const CAMPOS: readonly string[] = ['codigoBulto', 'cantidadVerificada', 'temperatura', 'observacion'];

/**
 * Recepción de un bulto: se escanea (o escribe) su código y se informan precinto, cantidad contada
 * y temperatura de llegada. El SERVIDOR decide si es conforme (R8): el resultado se muestra
 * tal cual. Un código inexistente (404 BULTO_INEXISTENTE), ya recibido (409 BULTO_DUPLICADO) o
 * ajeno (404) se muestran con el mensaje de la API arriba del formulario.
 */
@Component({
  selector: 'mc-formulario-recepcion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ErrorApiComponente, Estado, FormField, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, Tarjeta],
  providers: [...proveerOpcionesMaterial()],
  templateUrl: './formulario-recepcion.html',
  styles: `
    .campos {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 0 12px;
    }
    .resultado {
      display: grid;
      gap: 6px;
      margin-top: 12px;
      padding: 12px 14px;
      border: 1px solid var(--mc-borde-fuerte);
      border-radius: var(--mc-radio-control);
      background: var(--mc-superficie-2);
    }
    .resultado p {
      margin: 0;
    }
  `,
})
export class FormularioRecepcion {
  private readonly api = inject(RecepcionesService);

  /** Se emite al registrar la recepción, para que la pantalla recargue su historial. */
  readonly recibida = output<RecepcionResponseDto>();

  private readonly modelo = signal<DatosRecepcion>({ codigoBulto: '', precintoIntacto: true, cantidadVerificada: '', temperatura: '', observacion: '' });

  protected readonly formulario = form(this.modelo, (c) => {
    required(c.codigoBulto, { message: 'Escaneá o escribí el código del bulto.' });
    required(c.cantidadVerificada, { message: 'Escribí cuántas cajas contaste.' });
    required(c.temperatura, { message: 'Escribí la temperatura de llegada.' });
  });

  protected readonly errorGeneral = signal<ErrorApi | null>(null);
  protected readonly ultima = signal<RecepcionResponseDto | null>(null);
  protected readonly presentacion = PRESENTACION_RECEPCION;

  protected enviar(evento: Event): void {
    evento.preventDefault();
    this.errorGeneral.set(null);
    this.ultima.set(null);
    void submit(this.formulario, async () => {
      const m = this.modelo();
      const resultado = await aResultado(
        this.api.recibirBulto({
          body: {
            codigoBulto: m.codigoBulto.trim().toUpperCase(),
            precintoIntacto: m.precintoIntacto,
            cantidadVerificada: Number(m.cantidadVerificada),
            temperatura: Number(m.temperatura.replace(',', '.')),
            ...(m.observacion.trim() === '' ? {} : { observacion: m.observacion.trim() }),
          },
        }),
      );
      if (resultado.ok) {
        this.ultima.set(resultado.valor);
        this.modelo.set({ codigoBulto: '', precintoIntacto: true, cantidadVerificada: '', temperatura: '', observacion: '' });
        this.formulario().reset();
        this.recibida.emit(resultado.valor);
        return undefined;
      }
      return this.repartir(resultado.error);
    });
  }

  private repartir(error: ErrorApi): ValidationError.WithFieldTree[] {
    const deCampo: ValidationError.WithFieldTree[] = [];
    for (const campo of error.campos) {
      const nombre = campo.field.split('.').pop() as keyof DatosRecepcion;
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
