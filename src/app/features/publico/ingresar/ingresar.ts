import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormField, email, form, required, submit, ValidationError } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { destinoDespuesDeIngresar, mensajeDeMotivo } from '../../../core/auth/destino-seguro';
import { SesionService } from '../../../core/auth/sesion.service';
import { ErrorApi } from '../../../core/errores/error-api';
import { proveerOpcionesMaterial } from '../../../core/tema/opciones-material';
import { ErrorApiComponente } from '../../../shared/ui/error-api';

/** Datos que escribe la persona. */
interface DatosIngreso {
  email: string;
  password: string;
}

/**
 * Pantalla de ingreso: correo y contraseña contra el backend.
 *
 * - Validación local (obligatorio, formato de correo) con Signal Forms.
 * - 400: cada error por campo va a su campo. 401: el mensaje de la API arriba del formulario.
 * - Con sesión, va a la ruta de `volver` (si es interna y segura) o al inicio de su rol.
 */
@Component({
  selector: 'mc-ingresar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ErrorApiComponente, FormField, MatButtonModule, MatFormFieldModule, MatInputModule, RouterLink],
  providers: [...proveerOpcionesMaterial()],
  templateUrl: './ingresar.html',
  styleUrl: './ingresar.scss',
})
export class Ingresar {
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);
  private readonly consulta = inject(ActivatedRoute).snapshot.queryParamMap;

  private readonly modelo = signal<DatosIngreso>({ email: '', password: '' });

  /** Formulario con sus validaciones. */
  protected readonly formulario = form(this.modelo, (campos) => {
    required(campos.email, { message: 'Escribí tu correo electrónico.' });
    email(campos.email, { message: 'Escribí un correo con formato válido, por ejemplo nombre@dominio.com.' });
    required(campos.password, { message: 'Escribí tu contraseña.' });
  });

  /** Error general de la API (por ejemplo, credenciales inválidas), arriba del formulario. */
  protected readonly errorGeneral = signal<ErrorApi | null>(null);

  /** Por qué se pidió ingresar de nuevo (sesión vencida o rechazada), si viene en la dirección. */
  protected readonly avisoMotivo = mensajeDeMotivo(this.consulta.get('motivo'));

  /** Envía el formulario. */
  protected enviar(evento: Event): void {
    evento.preventDefault();
    this.errorGeneral.set(null);
    void submit(this.formulario, async () => {
      const resultado = await this.sesion.iniciarSesion(this.modelo());
      if (resultado.ok) {
        const destino = destinoDespuesDeIngresar(this.consulta.get('volver'), resultado.valor.rol);
        await this.router.navigateByUrl(destino);
        return undefined;
      }
      return this.repartirError(resultado.error);
    });
  }

  /**
   * Reparte el error de la API: los errores por campo (400) van a su campo; todo lo demás
   * queda arriba del formulario. Devuelve los errores de campo para Signal Forms.
   */
  private repartirError(error: ErrorApi): ValidationError.WithFieldTree[] {
    const deCampo: ValidationError.WithFieldTree[] = [];
    for (const campo of error.campos) {
      const nombre = campo.field.split('.').pop();
      if (nombre === 'email' || nombre === 'password') {
        deCampo.push({ kind: 'servidor', message: campo.message, fieldTree: this.formulario[nombre] });
      }
    }
    if (deCampo.length === 0) {
      this.errorGeneral.set(error);
    }
    return deCampo;
  }
}
