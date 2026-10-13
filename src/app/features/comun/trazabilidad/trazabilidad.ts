import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RecorridoCodigoResponseDto } from '../../../core/api/modelos';
import { ErrorApi } from '../../../core/errores/error-api';
import { proveerOpcionesMaterial } from '../../../core/tema/opciones-material';
import { CampoCodigo, CodigoLeido } from '../../../shared/ui/campo-codigo';
import { ErrorApiComponente } from '../../../shared/ui/error-api';
import { Icono } from '../../../shared/ui/icono';
import { ResultadoRecorrido } from './resultado-recorrido';
import { CriterioTrazabilidad, TrazabilidadDatos } from './trazabilidad.datos';

/** Qué se busca. */
type QueBuscar = 'CAJA' | 'BULTO' | 'LOTE';

/** Datos que escribe la persona. */
interface DatosBusqueda {
  que: QueBuscar;
  gtin: string;
  serie: string;
  bulto: string;
  lote: string;
}

/** Las tres formas de buscar, con su texto. */
const OPCIONES: readonly { readonly valor: QueBuscar; readonly texto: string }[] = [
  { valor: 'CAJA', texto: 'Una caja (GTIN y serie)' },
  { valor: 'BULTO', texto: 'Un bulto' },
  { valor: 'LOTE', texto: 'Un lote' },
];

/**
 * Trazabilidad por código: se busca un lote, un bulto o una caja y se ven sus eventos de la cadena, en orden.
 * Cada rol ve solo lo que ya ve de esa entidad (la API responde 404 para lo ajeno, y el mensaje se muestra
 * tal cual). Un código de lote puede repetirse entre laboratorios: llegan todos los visibles, cada uno con su
 * laboratorio. No se muestran datos de pacientes (R13): ver ResultadoRecorrido.
 */
@Component({
  selector: 'mc-trazabilidad',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CampoCodigo, ErrorApiComponente, FormField, Icono, MatButtonModule, MatFormFieldModule, MatInputModule, ResultadoRecorrido],
  providers: [TrazabilidadDatos, ...proveerOpcionesMaterial()],
  template: `
    <h1>Trazabilidad por código</h1>
    <p class="secundario">
      Buscá un lote, un bulto o una caja para ver todo lo que pasó con él, en el orden de la cadena. Solo ves lo
      que ya ve tu rol.
    </p>

    <form class="tarjeta" novalidate (submit)="buscar($event)">
      <fieldset>
        <legend>Qué querés buscar</legend>
        <div class="opciones">
          @for (o of opciones; track o.valor) {
            <label>
              <input type="radio" name="que" [value]="o.valor" [checked]="modelo().que === o.valor" (change)="elegir(o.valor)" />
              {{ o.texto }}
            </label>
          }
        </div>
      </fieldset>

      <mc-error-api [error]="errorGeneral()" />

      @switch (modelo().que) {
        @case ('CAJA') {
          <mc-campo-codigo (leido)="alLeer($event)" />
          <div class="campos">
            <mat-form-field>
              <mat-label>GTIN</mat-label>
              <input matInput inputmode="numeric" autocomplete="off" [formField]="formulario.gtin" />
              <mat-hint>14 dígitos</mat-hint>
              @for (error of formulario.gtin().errors(); track $index) { <mat-error>{{ error.message }}</mat-error> }
            </mat-form-field>
            <mat-form-field>
              <mat-label>Número de serie</mat-label>
              <input matInput autocomplete="off" spellcheck="false" [formField]="formulario.serie" />
              <mat-hint>Letras y números, hasta 20</mat-hint>
              @for (error of formulario.serie().errors(); track $index) { <mat-error>{{ error.message }}</mat-error> }
            </mat-form-field>
          </div>
        }
        @case ('BULTO') {
          <mat-form-field>
            <mat-label>Código del bulto</mat-label>
            <input matInput autocomplete="off" spellcheck="false" [formField]="formulario.bulto" />
            <mat-hint>Por ejemplo BUL-0001</mat-hint>
            @for (error of formulario.bulto().errors(); track $index) { <mat-error>{{ error.message }}</mat-error> }
          </mat-form-field>
        }
        @case ('LOTE') {
          <mat-form-field>
            <mat-label>Código del lote</mat-label>
            <input matInput autocomplete="off" spellcheck="false" [formField]="formulario.lote" />
            <mat-hint>Por ejemplo L2026-0001</mat-hint>
            @for (error of formulario.lote().errors(); track $index) { <mat-error>{{ error.message }}</mat-error> }
          </mat-form-field>
        }
      }

      <div>
        <button mat-flat-button type="submit" [disabled]="formulario().submitting()">
          <mc-icono nombre="search" />{{ formulario().submitting() ? 'Buscando…' : 'Buscar' }}
        </button>
      </div>
    </form>

    <div class="zona-resultado" aria-live="polite">
      @if (respuesta(); as r) {
        <h2 id="titulo-resultado" tabindex="-1">
          {{ r.resultados.length === 1 ? '1 resultado' : r.resultados.length + ' resultados' }}
        </h2>
        @for (resultado of r.resultados; track resultado.entidadId) {
          <mc-resultado-recorrido [resultado]="resultado" />
        }
      }
    </div>
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
      max-width: 880px;
    }
    h1,
    h2,
    p {
      margin: 0;
    }
    .secundario {
      color: var(--mc-texto-secundario);
    }
    .tarjeta {
      display: grid;
      gap: 8px;
      padding: 20px;
      background: var(--mc-superficie);
      border: 1px solid var(--mc-borde);
      border-radius: var(--mc-radio-tarjeta);
    }
    fieldset {
      margin: 0;
      padding: 0;
      border: 0;
    }
    legend {
      padding: 0;
      margin-bottom: 4px;
      font-weight: 600;
    }
    .opciones {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }
    .opciones label {
      display: inline-flex;
      gap: 6px;
      align-items: center;
    }
    .campos {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 0 12px;
    }
    .zona-resultado {
      display: grid;
      gap: 12px;
    }
  `,
})
export class Trazabilidad {
  private readonly datos = inject(TrazabilidadDatos);
  private readonly documento = inject(DOCUMENT);

  protected readonly opciones = OPCIONES;

  protected readonly modelo = signal<DatosBusqueda>({ que: 'CAJA', gtin: '', serie: '', bulto: '', lote: '' });

  /** Formulario: solo se exigen los campos de lo que se está buscando (el formato lo valida la API). */
  protected readonly formulario = form(this.modelo, (campos) => {
    required(campos.gtin, { message: 'Escribí el GTIN de la caja.', when: ({ valueOf }) => valueOf(campos.que) === 'CAJA' });
    required(campos.serie, { message: 'Escribí el número de serie de la caja.', when: ({ valueOf }) => valueOf(campos.que) === 'CAJA' });
    required(campos.bulto, { message: 'Escribí el código del bulto.', when: ({ valueOf }) => valueOf(campos.que) === 'BULTO' });
    required(campos.lote, { message: 'Escribí el código del lote.', when: ({ valueOf }) => valueOf(campos.que) === 'LOTE' });
  });

  /** Respuesta de la última búsqueda. */
  protected readonly respuesta = signal<RecorridoCodigoResponseDto | null>(null);

  /** Error de la API (400, 404…), tal cual lo dice. */
  protected readonly errorGeneral = signal<ErrorApi | null>(null);

  constructor() {
    // Al aparecer el resultado, el foco pasa a su título: quien usa lector de pantalla lo escucha.
    effect(() => {
      if (this.respuesta() !== null) {
        queueMicrotask(() => this.documento.getElementById('titulo-resultado')?.focus());
      }
    });
  }

  /** Cambia lo que se busca y limpia lo anterior. */
  protected elegir(que: QueBuscar): void {
    this.modelo.update((m) => ({ ...m, que }));
    this.errorGeneral.set(null);
    this.respuesta.set(null);
  }

  /** Completa GTIN y serie con lo leído de un código (pegado, tipeado o escaneado con la cámara). */
  protected alLeer(codigo: CodigoLeido): void {
    this.modelo.update((m) => ({ ...m, gtin: codigo.gtin, serie: codigo.serie }));
  }

  /** Envía la búsqueda. */
  protected buscar(evento: Event): void {
    evento.preventDefault();
    this.errorGeneral.set(null);
    this.respuesta.set(null);
    void submit(this.formulario, async () => {
      const resultado = await this.datos.buscar(this.criterio());
      if (resultado.ok) {
        this.respuesta.set(resultado.valor);
      } else {
        this.errorGeneral.set(resultado.error);
      }
      return undefined;
    });
  }

  /** El criterio según lo elegido, con los textos sin espacios de los costados. */
  private criterio(): CriterioTrazabilidad {
    const m = this.modelo();
    switch (m.que) {
      case 'CAJA':
        return { tipo: 'CAJA', gtin: m.gtin.trim(), serie: m.serie.trim() };
      case 'BULTO':
        return { tipo: 'BULTO', codigo: m.bulto.trim() };
      case 'LOTE':
        return { tipo: 'LOTE', codigo: m.lote.trim() };
    }
  }
}
