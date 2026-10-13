import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormField, email, form, required, submit, ValidationError } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { RegistroResponseDto } from '../../../core/api/modelos';
import { ErrorApi } from '../../../core/errores/error-api';
import { proveerOpcionesMaterial } from '../../../core/tema/opciones-material';
import { ErrorApiComponente } from '../../../shared/ui/error-api';
import { RegistroDatos } from './registro.datos';

/** Campos del formulario. */
interface DatosPaciente {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  password: string;
}

const CAMPOS: readonly (keyof DatosPaciente)[] = ['nombre', 'apellido', 'dni', 'email', 'password'];

/**
 * Registro público de un paciente: crea su cuenta para verificar cajas con sesión y reportar un problema.
 * El DNI es el de la persona; la API lo valida y la pantalla nunca lo vuelve a mostrar. La contraseña no se
 * guarda ni se muestra.
 */
@Component({
  selector: 'mc-registrar-paciente',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ErrorApiComponente, FormField, MatButtonModule, MatFormFieldModule, MatInputModule, RouterLink],
  providers: [RegistroDatos, ...proveerOpcionesMaterial()],
  template: `
    <section class="registro">
      <header>
        <h1>Crear mi cuenta de paciente</h1>
        <p class="secundario">Para verificar tus medicamentos con tu cuenta y reportar un problema con una caja.</p>
      </header>

      @if (registrada(); as r) {
        <div class="listo" role="status">
          <h2>Cuenta creada</h2>
          <p>{{ r.mensaje }}</p>
          <p><a routerLink="/ingresar">Ir a ingresar</a></p>
        </div>
      } @else {
        <form class="tarjeta" novalidate (submit)="enviar($event)">
          <mc-error-api [error]="errorGeneral()" />
          <div class="campos">
            <mat-form-field>
              <mat-label>Nombre</mat-label>
              <input matInput autocomplete="given-name" [formField]="formulario.nombre" />
              @for (e of formulario.nombre().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
            </mat-form-field>
            <mat-form-field>
              <mat-label>Apellido</mat-label>
              <input matInput autocomplete="family-name" [formField]="formulario.apellido" />
              @for (e of formulario.apellido().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
            </mat-form-field>
            <mat-form-field>
              <mat-label>DNI</mat-label>
              <input matInput inputmode="numeric" autocomplete="off" [formField]="formulario.dni" />
              <mat-hint>8 dígitos, sin puntos</mat-hint>
              @for (e of formulario.dni().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
            </mat-form-field>
            <mat-form-field>
              <mat-label>Correo electrónico</mat-label>
              <input matInput type="email" autocomplete="email" [formField]="formulario.email" />
              @for (e of formulario.email().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
            </mat-form-field>
            <mat-form-field>
              <mat-label>Contraseña</mat-label>
              <input matInput type="password" autocomplete="new-password" [formField]="formulario.password" />
              <mat-hint>De 8 a 72 caracteres</mat-hint>
              @for (e of formulario.password().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
            </mat-form-field>
          </div>
          <div>
            <button mat-flat-button type="submit" [disabled]="formulario().submitting()">
              {{ formulario().submitting() ? 'Creando…' : 'Crear mi cuenta' }}
            </button>
          </div>
        </form>
        <p class="secundario">¿Ya tenés cuenta? <a routerLink="/ingresar">Ingresá</a>.</p>
      }
    </section>
  `,
  styleUrl: './registro.scss',
})
export class RegistrarPaciente {
  private readonly datos = inject(RegistroDatos);

  private readonly modelo = signal<DatosPaciente>({ nombre: '', apellido: '', dni: '', email: '', password: '' });

  protected readonly formulario = form(this.modelo, (c) => {
    required(c.nombre, { message: 'Escribí tu nombre.' });
    required(c.apellido, { message: 'Escribí tu apellido.' });
    required(c.dni, { message: 'Escribí tu DNI.' });
    required(c.email, { message: 'Escribí tu correo electrónico.' });
    email(c.email, { message: 'Escribí un correo con formato válido.' });
    required(c.password, { message: 'Escribí una contraseña.' });
  });

  protected readonly errorGeneral = signal<ErrorApi | null>(null);
  protected readonly registrada = signal<RegistroResponseDto | null>(null);

  protected enviar(evento: Event): void {
    evento.preventDefault();
    this.errorGeneral.set(null);
    void submit(this.formulario, async () => {
      const m = this.modelo();
      const resultado = await this.datos.registrarPaciente({
        nombre: m.nombre.trim(),
        apellido: m.apellido.trim(),
        dni: m.dni.trim(),
        email: m.email.trim(),
        password: m.password,
      });
      if (resultado.ok) {
        // Ni el DNI ni la contraseña quedan en memoria más tiempo del necesario.
        this.modelo.set({ nombre: '', apellido: '', dni: '', email: '', password: '' });
        this.registrada.set(resultado.valor);
        return undefined;
      }
      return this.repartir(resultado.error);
    });
  }

  /** Errores 400 por campo → a su campo; todo lo demás (409 REGISTRO_NO_COMPLETADO…), arriba del formulario. */
  private repartir(error: ErrorApi): ValidationError.WithFieldTree[] {
    const deCampo: ValidationError.WithFieldTree[] = [];
    for (const campo of error.campos) {
      const nombre = campo.field.split('.').pop() as keyof DatosPaciente;
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
