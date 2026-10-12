import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormField, form, required, submit, ValidationError } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { BultosService } from '../../../core/api/generado/services/bultos.service';
import { CircuitosService } from '../../../core/api/generado/services/circuitos.service';
import { LotesService } from '../../../core/api/generado/services/lotes.service';
import { EnlaceCuitResponseDto, LoteResponseDto } from '../../../core/api/modelos';
import { TAMANO_PAGINA_MAXIMO } from '../../../core/api/pagina';
import { aResultado } from '../../../core/api/resultado';
import { ErrorApi } from '../../../core/errores/error-api';
import { NombresService } from '../../../core/nombres/nombres.service';
import { proveerOpcionesMaterial } from '../../../core/tema/opciones-material';
import { ErrorApiComponente } from '../../../shared/ui/error-api';
import { Tarjeta } from '../../../shared/ui/tarjeta';

interface DatosBulto {
  loteId: string;
  circuitoId: string;
  precinto: string;
  cantidad: string;
}

/** Un circuito aprobado con el nombre de su farmacia, para elegirlo. */
interface OpcionCircuito {
  readonly circuito: EnlaceCuitResponseDto;
  readonly texto: string;
}

const CAMPOS: readonly string[] = ['loteId', 'circuitoId', 'precinto', 'cantidad'];

/**
 * Arma un bulto cerrado: cajas de UN lote liberado, con precinto y con un circuito aprobado
 * (que fija la farmacia de destino). Las reglas (R6, R10: lote liberado, cajas libres, no
 * bloqueadas) las decide la API; sus 409 se muestran tal cual arriba del formulario.
 */
@Component({
  selector: 'mc-formulario-armar-bulto',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ErrorApiComponente, FormField, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, Tarjeta],
  providers: [...proveerOpcionesMaterial()],
  template: `
    <mc-tarjeta titulo="Armar un bulto" detalle="Cajas de un lote liberado, para una farmacia con circuito aprobado">
      @if (cargando()) {
        <p role="status">Buscando lotes y circuitos…</p>
      } @else if (lotes().length === 0 || circuitos().length === 0) {
        <p class="aviso" role="status">
          @if (lotes().length === 0) { No tenés lotes liberados todavía. }
          @if (circuitos().length === 0) { No tenés circuitos aprobados: proponé uno en "Circuitos". }
        </p>
      } @else {
        <form novalidate (submit)="enviar($event)">
          <mc-error-api [error]="errorGeneral()" />
          <div class="campos">
            <mat-form-field>
              <mat-label>Lote</mat-label>
              <mat-select [formField]="formulario.loteId">
                @for (l of lotes(); track l.id) { <mat-option [value]="l.id">{{ l.codigo }} · {{ l.cantidad }} cajas</mat-option> }
              </mat-select>
              @for (e of formulario.loteId().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
            </mat-form-field>
            <mat-form-field>
              <mat-label>Circuito (farmacia de destino)</mat-label>
              <mat-select [formField]="formulario.circuitoId">
                @for (c of circuitos(); track c.circuito.id) { <mat-option [value]="c.circuito.id">{{ c.texto }}</mat-option> }
              </mat-select>
              @for (e of formulario.circuitoId().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
            </mat-form-field>
            <mat-form-field>
              <mat-label>Precinto</mat-label>
              <input matInput autocomplete="off" [formField]="formulario.precinto" />
              @for (e of formulario.precinto().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
            </mat-form-field>
            <mat-form-field>
              <mat-label>Cantidad de cajas</mat-label>
              <input matInput inputmode="numeric" autocomplete="off" [formField]="formulario.cantidad" />
              <mat-hint>Hasta 1.000; se toman las primeras libres del lote</mat-hint>
              @for (e of formulario.cantidad().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
            </mat-form-field>
          </div>
          <button mat-flat-button type="submit" [disabled]="formulario().submitting()">
            {{ formulario().submitting() ? 'Armando…' : 'Armar bulto' }}
          </button>
        </form>
      }
    </mc-tarjeta>
  `,
  styles: `
    .campos {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 0 12px;
    }
    .aviso {
      color: var(--mc-atencion);
      font-weight: 600;
    }
  `,
})
export class FormularioArmarBulto {
  private readonly bultos = inject(BultosService);
  private readonly lotesApi = inject(LotesService);
  private readonly circuitosApi = inject(CircuitosService);
  private readonly nombres = inject(NombresService);

  /** Se emite el bulto armado, para que la pantalla recargue su listado. */
  readonly armado = output<void>();

  private readonly modelo = signal<DatosBulto>({ loteId: '', circuitoId: '', precinto: '', cantidad: '' });

  protected readonly formulario = form(this.modelo, (c) => {
    required(c.loteId, { message: 'Elegí el lote.' });
    required(c.circuitoId, { message: 'Elegí el circuito.' });
    required(c.precinto, { message: 'Escribí el precinto.' });
    required(c.cantidad, { message: 'Escribí cuántas cajas.' });
  });

  protected readonly lotes = signal<readonly LoteResponseDto[]>([]);
  protected readonly circuitos = signal<readonly OpcionCircuito[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorGeneral = signal<ErrorApi | null>(null);

  constructor() {
    void this.cargar();
  }

  /** Lotes LIBERADO y circuitos APROBADO (hasta 100 de cada uno). */
  private async cargar(): Promise<void> {
    // Las dos búsquedas van en paralelo.
    const [lotes, circuitos] = await Promise.all([
      aResultado(this.lotesApi.listarLotes({ estado: 'LIBERADO', size: TAMANO_PAGINA_MAXIMO })),
      aResultado(
      this.circuitosApi.listarCircuitos({ estado: 'APROBADO', size: TAMANO_PAGINA_MAXIMO }).pipe(
        switchMap((pagina) =>
          pagina.content.length === 0
            ? of<OpcionCircuito[]>([])
            : forkJoin(
                pagina.content.map((circuito) =>
                  forkJoin({ farmacia: this.nombres.empresa(circuito.farmaciaId), distribuidor: this.nombres.empresa(circuito.distribuidorId) }).pipe(
                    map((n): OpcionCircuito => ({
                      circuito,
                      texto: `${circuito.codigo} · ${n.farmacia?.razonSocial ?? '(sin datos)'} vía ${n.distribuidor?.razonSocial ?? '(sin datos)'}`,
                    })),
                  ),
                ),
              ),
        ),
      ),
      ),
    ]);
    if (lotes.ok) {
      this.lotes.set(lotes.valor.content);
    } else {
      this.errorGeneral.set(lotes.error);
    }
    if (circuitos.ok) {
      this.circuitos.set(circuitos.valor);
    } else {
      this.errorGeneral.set(circuitos.error);
    }
    this.cargando.set(false);
  }

  protected enviar(evento: Event): void {
    evento.preventDefault();
    this.errorGeneral.set(null);
    void submit(this.formulario, async () => {
      const m = this.modelo();
      const resultado = await aResultado(
        this.bultos.armarBulto({ body: { loteId: m.loteId, circuitoId: m.circuitoId, precinto: m.precinto.trim(), cantidad: Number(m.cantidad) } }),
      );
      if (resultado.ok) {
        this.modelo.update((actual) => ({ ...actual, precinto: '', cantidad: '' }));
        this.formulario().reset();
        this.armado.emit();
        return undefined;
      }
      return this.repartir(resultado.error);
    });
  }

  private repartir(error: ErrorApi): ValidationError.WithFieldTree[] {
    const deCampo: ValidationError.WithFieldTree[] = [];
    for (const campo of error.campos) {
      const nombre = campo.field.split('.').pop() as keyof DatosBulto;
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
