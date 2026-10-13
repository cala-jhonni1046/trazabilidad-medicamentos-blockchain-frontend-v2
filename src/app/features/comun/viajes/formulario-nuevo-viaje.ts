import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormField, form, required, submit, ValidationError } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { map } from 'rxjs';
import { BultosService } from '../../../core/api/generado/services/bultos.service';
import { ViajesService } from '../../../core/api/generado/services/viajes.service';
import { BultoResponseDto, EstadoBulto } from '../../../core/api/modelos';
import { TAMANO_PAGINA_MAXIMO } from '../../../core/api/pagina';
import { aResultado } from '../../../core/api/resultado';
import { ErrorApi } from '../../../core/errores/error-api';
import { proveerOpcionesMaterial } from '../../../core/tema/opciones-material';
import { conOffsetArgentina } from '../../../shared/formato/fechas';
import { ErrorApiComponente } from '../../../shared/ui/error-api';
import { Tarjeta } from '../../../shared/ui/tarjeta';

interface DatosViaje {
  patente: string;
  chofer: string;
  fechaEstimada: string;
}

const CAMPOS: readonly string[] = ['patente', 'chofer', 'fechaEstimadaEntrega'];

/**
 * Crea un viaje con los bultos elegidos. El tramo lo decide el rol: el laboratorio despacha
 * bultos ARMADO a una distribuidora; la distribuidora, bultos EN_DEPOSITO a varias farmacias.
 * La fecha estimada se manda con el offset de Argentina (sin offset la API responde 400).
 * Las reglas (R7 un solo destino en el tramo 1, R10 bultos bloqueados) las decide la API.
 */
@Component({
  selector: 'mc-formulario-nuevo-viaje',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ErrorApiComponente, FormField, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, Tarjeta],
  providers: [...proveerOpcionesMaterial()],
  templateUrl: './formulario-nuevo-viaje.html',
  styles: `
    .campos {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 0 12px;
    }
    .bultos {
      display: grid;
      gap: 2px;
      margin: 0 0 12px;
      padding: 0;
      list-style: none;
    }
    .bultos-conjunto {
      margin: 0 0 12px;
      padding: 0;
      border: 0;
    }
    legend {
      margin-bottom: 4px;
      font-weight: 600;
    }
    .secundario {
      color: var(--mc-texto-secundario);
    }
    .falla {
      color: var(--mc-critico);
      font-weight: 600;
    }
  `,
})
export class FormularioNuevoViaje {
  private readonly bultosApi = inject(BultosService);
  private readonly viajes = inject(ViajesService);

  /** Estado de los bultos que se ofrecen: ARMADO (laboratorio) o EN_DEPOSITO (distribuidora). */
  readonly estadoBultos = input.required<Extract<EstadoBulto, 'ARMADO' | 'EN_DEPOSITO'>>();

  /** Se emite al crear el viaje, para que la pantalla recargue. */
  readonly creado = output<void>();

  private readonly modelo = signal<DatosViaje>({ patente: '', chofer: '', fechaEstimada: '' });

  protected readonly formulario = form(this.modelo, (c) => {
    required(c.patente, { message: 'Escribí la patente del camión.' });
    required(c.chofer, { message: 'Escribí el nombre del chofer.' });
    required(c.fechaEstimada, { message: 'Elegí la fecha y hora estimada de entrega.' });
  });

  protected readonly elegibles = signal<readonly BultoResponseDto[]>([]);
  protected readonly elegidos = signal<ReadonlySet<string>>(new Set());
  protected readonly cargando = signal(true);
  protected readonly errorGeneral = signal<ErrorApi | null>(null);
  protected readonly sinBultosElegidos = signal(false);
  protected readonly hayElegibles = computed(() => this.elegibles().length > 0);

  constructor() {
    // Se carga cuando el input ya tiene valor (un effect corre después de asignar los inputs).
    effect(() => {
      const estado = this.estadoBultos();
      untracked(() => void this.cargarBultos(estado));
    });
  }

  /** Los bultos que se pueden despachar (hasta 100). */
  private async cargarBultos(estado: Extract<EstadoBulto, 'ARMADO' | 'EN_DEPOSITO'> = this.estadoBultos()): Promise<void> {
    const resultado = await aResultado(this.bultosApi.listarBultos({ estado, size: TAMANO_PAGINA_MAXIMO }).pipe(map((pagina) => pagina.content)));
    if (resultado.ok) {
      // Un bulto que ya tiene viaje no se ofrece.
      this.elegibles.set(resultado.valor.filter((bulto) => (bulto.viajeActualId ?? null) === null));
    } else {
      this.errorGeneral.set(resultado.error);
    }
    this.cargando.set(false);
  }

  protected alternar(codigo: string, marcado: boolean): void {
    this.sinBultosElegidos.set(false);
    this.elegidos.update((actual) => {
      const nuevo = new Set(actual);
      if (marcado) {
        nuevo.add(codigo);
      } else {
        nuevo.delete(codigo);
      }
      return nuevo;
    });
  }

  protected enviar(evento: Event): void {
    evento.preventDefault();
    this.errorGeneral.set(null);
    this.sinBultosElegidos.set(this.elegidos().size === 0);
    void submit(this.formulario, async () => {
      const m = this.modelo();
      const fecha = conOffsetArgentina(m.fechaEstimada);
      if (this.elegidos().size === 0 || fecha === null) {
        return undefined;
      }
      const resultado = await aResultado(
        this.viajes.crearViaje({
          body: { bultos: [...this.elegidos()], patente: m.patente.trim(), chofer: m.chofer.trim(), fechaEstimadaEntrega: fecha },
        }),
      );
      if (resultado.ok) {
        this.modelo.set({ patente: '', chofer: '', fechaEstimada: '' });
        this.elegidos.set(new Set());
        this.formulario().reset();
        this.creado.emit();
        void this.cargarBultos();
        return undefined;
      }
      return this.repartir(resultado.error);
    });
  }

  private repartir(error: ErrorApi): ValidationError.WithFieldTree[] {
    const deCampo: ValidationError.WithFieldTree[] = [];
    for (const campo of error.campos) {
      const nombre = campo.field.split('.').pop() ?? '';
      if (CAMPOS.includes(nombre)) {
        const destino = nombre === 'fechaEstimadaEntrega' ? this.formulario.fechaEstimada : this.formulario[nombre as 'patente' | 'chofer'];
        deCampo.push({ kind: 'servidor', message: campo.message, fieldTree: destino });
      }
    }
    if (deCampo.length === 0) {
      this.errorGeneral.set(error);
    }
    return deCampo;
  }
}
