import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormField, form, required, submit, ValidationError } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CircuitosService } from '../../core/api/generado/services/circuitos.service';
import { EmpresasService } from '../../core/api/generado/services/empresas.service';
import { TipoEmpresa } from '../../core/api/modelos';
import { aResultado } from '../../core/api/resultado';
import { ErrorApi } from '../../core/errores/error-api';
import { proveerOpcionesMaterial } from '../../core/tema/opciones-material';
import { ROTULO_PROVINCIA } from '../../shared/formato/etiquetas';
import { ErrorApiComponente } from '../../shared/ui/error-api';
import { Tarjeta } from '../../shared/ui/tarjeta';

interface DatosCircuito {
  cuitDistribuidor: string;
  cuitFarmacia: string;
}

/** Lo que se encontró (o no) al buscar un CUIT. */
interface Busqueda {
  readonly texto: string;
  readonly esError: boolean;
}

/**
 * El director técnico del laboratorio propone un circuito: busca por CUIT a la distribuidora y a
 * la farmacia (que deben estar habilitadas) y los propone. Al salir de cada campo se busca la
 * empresa para confirmar que es la correcta; el 404 de la API se muestra tal cual. Las reglas
 * (R5: tres empresas habilitadas, un solo circuito vigente por par) las decide la API.
 */
@Component({
  selector: 'mc-formulario-proponer-circuito',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ErrorApiComponente, FormField, MatButtonModule, MatFormFieldModule, MatInputModule, Tarjeta],
  providers: [...proveerOpcionesMaterial()],
  template: `
    <mc-tarjeta titulo="Proponer un circuito" detalle="Laboratorio → distribuidora → farmacia, por CUIT">
      <form novalidate (submit)="enviar($event)">
        <mc-error-api [error]="errorGeneral()" />
        <div class="campos">
          <div>
            <mat-form-field>
              <mat-label>CUIT de la distribuidora</mat-label>
              <input matInput inputmode="numeric" autocomplete="off" [formField]="formulario.cuitDistribuidor" (blur)="buscar('DISTRIBUIDOR')" />
              @for (e of formulario.cuitDistribuidor().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
            </mat-form-field>
            @if (distribuidor(); as d) {
              <p class="busqueda" [class.error]="d.esError" role="status">{{ d.texto }}</p>
            }
          </div>
          <div>
            <mat-form-field>
              <mat-label>CUIT de la farmacia</mat-label>
              <input matInput inputmode="numeric" autocomplete="off" [formField]="formulario.cuitFarmacia" (blur)="buscar('FARMACIA')" />
              @for (e of formulario.cuitFarmacia().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
            </mat-form-field>
            @if (farmacia(); as f) {
              <p class="busqueda" [class.error]="f.esError" role="status">{{ f.texto }}</p>
            }
          </div>
        </div>
        <button mat-flat-button type="submit" [disabled]="formulario().submitting()">
          {{ formulario().submitting() ? 'Proponiendo…' : 'Proponer circuito' }}
        </button>
      </form>
    </mc-tarjeta>
  `,
  styles: `
    .campos {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 0 12px;
    }
    .busqueda {
      margin: -8px 0 12px;
      color: var(--mc-correcto);
      font-weight: 600;
    }
    .busqueda.error {
      color: var(--mc-critico);
    }
  `,
})
export class FormularioProponerCircuito {
  private readonly empresas = inject(EmpresasService);
  private readonly circuitos = inject(CircuitosService);

  /** Se emite al proponer, para que la pantalla recargue el listado. */
  readonly propuesto = output<void>();

  private readonly modelo = signal<DatosCircuito>({ cuitDistribuidor: '', cuitFarmacia: '' });

  protected readonly formulario = form(this.modelo, (c) => {
    required(c.cuitDistribuidor, { message: 'Escribí el CUIT de la distribuidora.' });
    required(c.cuitFarmacia, { message: 'Escribí el CUIT de la farmacia.' });
  });

  protected readonly distribuidor = signal<Busqueda | null>(null);
  protected readonly farmacia = signal<Busqueda | null>(null);
  protected readonly errorGeneral = signal<ErrorApi | null>(null);

  /** Busca la empresa del CUIT escrito y muestra su nombre, o el error de la API. */
  protected async buscar(tipo: Extract<TipoEmpresa, 'DISTRIBUIDOR' | 'FARMACIA'>): Promise<void> {
    const cuit = (tipo === 'DISTRIBUIDOR' ? this.modelo().cuitDistribuidor : this.modelo().cuitFarmacia).trim();
    const destino = tipo === 'DISTRIBUIDOR' ? this.distribuidor : this.farmacia;
    if (cuit === '') {
      destino.set(null);
      return;
    }
    const resultado = await aResultado(this.empresas.buscarEmpresaPorCuit({ cuit, tipo }));
    destino.set(
      resultado.ok
        ? {
            texto: [resultado.valor.razonSocial, resultado.valor.provincia === undefined ? null : ROTULO_PROVINCIA[resultado.valor.provincia]].filter((t) => t).join(' · '),
            esError: false,
          }
        : { texto: resultado.error.mensaje, esError: true },
    );
  }

  protected enviar(evento: Event): void {
    evento.preventDefault();
    this.errorGeneral.set(null);
    void submit(this.formulario, async () => {
      const m = this.modelo();
      const resultado = await aResultado(
        this.circuitos.proponerCircuito({ body: { cuitDistribuidor: m.cuitDistribuidor.trim(), cuitFarmacia: m.cuitFarmacia.trim() } }),
      );
      if (resultado.ok) {
        this.modelo.set({ cuitDistribuidor: '', cuitFarmacia: '' });
        this.formulario().reset();
        this.distribuidor.set(null);
        this.farmacia.set(null);
        this.propuesto.emit();
        return undefined;
      }
      return this.repartir(resultado.error);
    });
  }

  private repartir(error: ErrorApi): ValidationError.WithFieldTree[] {
    const deCampo: ValidationError.WithFieldTree[] = [];
    for (const campo of error.campos) {
      const nombre = campo.field.split('.').pop();
      if (nombre === 'cuitDistribuidor' || nombre === 'cuitFarmacia') {
        deCampo.push({ kind: 'servidor', message: campo.message, fieldTree: this.formulario[nombre] });
      }
    }
    if (deCampo.length === 0) {
      this.errorGeneral.set(error);
    }
    return deCampo;
  }
}
