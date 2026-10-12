import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormField, email, form, required, submit, ValidationError } from '@angular/forms/signals';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UsuariosService } from '../../../core/api/generado/services/usuarios.service';
import { RolUsuario } from '../../../core/api/modelos';
import { aResultado } from '../../../core/api/resultado';
import { ErrorApi } from '../../../core/errores/error-api';
import { proveerOpcionesMaterial } from '../../../core/tema/opciones-material';
import { ErrorApiComponente } from '../../../shared/ui/error-api';

/** Lo que se le pasa al diálogo: qué roles se pueden crear y si hay marcas de empresa. */
export interface DatosDialogoNuevoUsuario {
  readonly titulo: string;
  readonly roles: readonly { readonly valor: RolUsuario; readonly texto: string }[];
  /** True para empresas: ofrece "administrador" y "director técnico". */
  readonly conMarcasDeEmpresa: boolean;
}

interface DatosUsuario {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  password: string;
  rol: RolUsuario | '';
  esAdminEmpresa: boolean;
  esDirectorTecnico: boolean;
}

const CAMPOS: readonly (keyof DatosUsuario)[] = ['nombre', 'apellido', 'dni', 'email', 'password', 'rol'];

/**
 * Alta de un usuario (de la Sede o empleado de una empresa). La API decide qué roles puede
 * crear cada uno (ROL_NO_PERMITIDO → 409, tal cual). Errores 400 por campo, el resto arriba.
 */
@Component({
  selector: 'mc-dialogo-nuevo-usuario',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ErrorApiComponente, FormField, MatButtonModule, MatCheckboxModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  providers: [...proveerOpcionesMaterial()],
  template: `
    <h2 mat-dialog-title>{{ datos.titulo }}</h2>
    <form novalidate (submit)="enviar($event)">
      <mat-dialog-content>
        <mc-error-api [error]="errorGeneral()" />
        <div class="campos">
          <mat-form-field>
            <mat-label>Nombre</mat-label>
            <input matInput autocomplete="off" [formField]="formulario.nombre" />
            @for (e of formulario.nombre().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Apellido</mat-label>
            <input matInput autocomplete="off" [formField]="formulario.apellido" />
            @for (e of formulario.apellido().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
          </mat-form-field>
          <mat-form-field>
            <mat-label>DNI</mat-label>
            <input matInput inputmode="numeric" autocomplete="off" [formField]="formulario.dni" />
            @for (e of formulario.dni().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Correo electrónico</mat-label>
            <input matInput type="email" autocomplete="off" [formField]="formulario.email" />
            @for (e of formulario.email().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Contraseña inicial</mat-label>
            <input matInput type="password" autocomplete="new-password" [formField]="formulario.password" />
            @for (e of formulario.password().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Rol</mat-label>
            <mat-select [formField]="formulario.rol">
              @for (r of datos.roles; track r.valor) { <mat-option [value]="r.valor">{{ r.texto }}</mat-option> }
            </mat-select>
            @for (e of formulario.rol().errors(); track $index) { <mat-error>{{ e.message }}</mat-error> }
          </mat-form-field>
        </div>
        @if (datos.conMarcasDeEmpresa) {
          <div class="marcas">
            <mat-checkbox [formField]="formulario.esAdminEmpresa">Administrador de la empresa</mat-checkbox>
            <mat-checkbox [formField]="formulario.esDirectorTecnico">Director técnico</mat-checkbox>
          </div>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-flat-button type="submit" [disabled]="formulario().submitting()">
          {{ formulario().submitting() ? 'Guardando…' : 'Crear usuario' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .campos {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 0 12px;
    }
    .marcas {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 24px;
    }
  `,
})
export class DialogoNuevoUsuario {
  protected readonly datos = inject<DatosDialogoNuevoUsuario>(MAT_DIALOG_DATA);
  private readonly api = inject(UsuariosService);
  private readonly referencia = inject<MatDialogRef<DialogoNuevoUsuario, boolean>>(MatDialogRef);

  private readonly modelo = signal<DatosUsuario>({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    password: '',
    // Con un solo rol posible, ya viene elegido.
    rol: this.datos.roles.length === 1 ? this.datos.roles[0].valor : '',
    esAdminEmpresa: false,
    esDirectorTecnico: false,
  });

  protected readonly formulario = form(this.modelo, (c) => {
    required(c.nombre, { message: 'Escribí el nombre.' });
    required(c.apellido, { message: 'Escribí el apellido.' });
    required(c.dni, { message: 'Escribí el DNI.' });
    required(c.email, { message: 'Escribí el correo electrónico.' });
    email(c.email, { message: 'Escribí un correo con formato válido.' });
    required(c.password, { message: 'Escribí una contraseña inicial.' });
    required(c.rol, { message: 'Elegí el rol.' });
  });

  protected readonly errorGeneral = signal<ErrorApi | null>(null);

  protected enviar(evento: Event): void {
    evento.preventDefault();
    this.errorGeneral.set(null);
    void submit(this.formulario, async () => {
      const m = this.modelo();
      const resultado = await aResultado(
        this.api.crearUsuario({
          body: {
            nombre: m.nombre.trim(),
            apellido: m.apellido.trim(),
            dni: m.dni.trim(),
            email: m.email.trim(),
            password: m.password,
            rol: m.rol as RolUsuario,
            ...(this.datos.conMarcasDeEmpresa ? { esAdminEmpresa: m.esAdminEmpresa, esDirectorTecnico: m.esDirectorTecnico } : {}),
          },
        }),
      );
      if (resultado.ok) {
        this.referencia.close(true);
        return undefined;
      }
      return this.repartir(resultado.error);
    });
  }

  private repartir(error: ErrorApi): ValidationError.WithFieldTree[] {
    const deCampo: ValidationError.WithFieldTree[] = [];
    for (const campo of error.campos) {
      const nombre = campo.field.split('.').pop() as keyof DatosUsuario;
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
