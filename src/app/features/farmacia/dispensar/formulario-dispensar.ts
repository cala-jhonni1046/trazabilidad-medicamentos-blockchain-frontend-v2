import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormField, form, required, submit, ValidationError } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DispensacionesService } from '../../../core/api/generado/services/dispensaciones.service';
import { DispensacionRequestDto } from '../../../core/api/modelos';
import { aResultado } from '../../../core/api/resultado';
import { ErrorApi } from '../../../core/errores/error-api';
import { proveerOpcionesMaterial } from '../../../core/tema/opciones-material';
import { CampoCodigo, CodigoLeido } from '../../../shared/ui/campo-codigo';
import { ErrorApiComponente } from '../../../shared/ui/error-api';
import { Tarjeta } from '../../../shared/ui/tarjeta';

interface DatosDispensacion {
  gtin: string;
  serie: string;
  particular: boolean;
  obraSocial: string;
  numeroAfiliado: string;
  numeroReceta: string;
  dni: string;
}

const CAMPOS: readonly string[] = ['gtin', 'serie', 'obraSocial', 'numeroAfiliado', 'numeroReceta', 'dni'];

/**
 * Dispensa una caja: GTIN + serie (escaneados o pegados), cobertura (particular, u obra social
 * y afiliado), receta y, opcional, el DNI. El DNI viaja solo a la API, que lo guarda
 * ENMASCARADO (R13): acá no se guarda ni se muestra completo. Las reglas (R10 bloqueada, R11 ya
 * dispensada, R14 robada, caja ajena → 404) las decide la API y sus errores se muestran tal cual.
 */
@Component({
  selector: 'mc-formulario-dispensar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CampoCodigo, ErrorApiComponente, FormField, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, Tarjeta],
  providers: [...proveerOpcionesMaterial()],
  templateUrl: './formulario-dispensar.html',
  styles: `
    .campos {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 0 12px;
    }
  `,
})
export class FormularioDispensar {
  private readonly api = inject(DispensacionesService);

  /** Se emite al dispensar, para que la pantalla recargue el historial. */
  readonly dispensada = output<void>();

  private readonly modelo = signal<DatosDispensacion>({ gtin: '', serie: '', particular: false, obraSocial: '', numeroAfiliado: '', numeroReceta: '', dni: '' });

  protected readonly formulario = form(this.modelo, (c) => {
    required(c.gtin, { message: 'Escribí el GTIN de la caja.' });
    required(c.serie, { message: 'Escribí el número de serie de la caja.' });
    required(c.numeroReceta, { message: 'Escribí el número de receta.' });
  });

  protected readonly errorGeneral = signal<ErrorApi | null>(null);

  /** Completa GTIN y serie con lo leído de un código. */
  protected alLeer(codigo: CodigoLeido): void {
    this.modelo.update((m) => ({ ...m, gtin: codigo.gtin, serie: codigo.serie }));
  }

  protected enviar(evento: Event): void {
    evento.preventDefault();
    this.errorGeneral.set(null);
    void submit(this.formulario, async () => {
      const m = this.modelo();
      const cuerpo: DispensacionRequestDto = {
        gtin: m.gtin.trim(),
        serie: m.serie.trim(),
        particular: m.particular,
        numeroReceta: m.numeroReceta.trim(),
        // Sin cobertura (particular) no se mandan obra social ni afiliado.
        ...(m.particular ? {} : { obraSocial: m.obraSocial.trim(), numeroAfiliado: m.numeroAfiliado.trim() }),
        ...(m.dni.trim() === '' ? {} : { dni: m.dni.trim() }),
      };
      const resultado = await aResultado(this.api.dispensarCaja({ body: cuerpo }));
      if (resultado.ok) {
        // Se limpia todo, incluido el DNI: no queda en pantalla.
        this.modelo.set({ gtin: '', serie: '', particular: false, obraSocial: '', numeroAfiliado: '', numeroReceta: '', dni: '' });
        this.formulario().reset();
        this.dispensada.emit();
        return undefined;
      }
      return this.repartir(resultado.error);
    });
  }

  private repartir(error: ErrorApi): ValidationError.WithFieldTree[] {
    const deCampo: ValidationError.WithFieldTree[] = [];
    for (const campo of error.campos) {
      const nombre = campo.field.split('.').pop() as keyof DatosDispensacion;
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
