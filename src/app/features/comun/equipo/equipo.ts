import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RolUsuario } from '../../../core/api/modelos';
import { SesionService } from '../../../core/auth/sesion.service';
import { ListaUsuarios } from '../usuarios/lista-usuarios';

/**
 * "Equipo" de una empresa (laboratorio, distribuidora o farmacia): sus usuarios y el alta de
 * empleados. Solo el administrador de la empresa ve el botón de alta (la API igual decide, y
 * exige que el rol sea el del tipo de la empresa: ROL_NO_PERMITIDO).
 */
@Component({
  selector: 'mc-equipo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ListaUsuarios],
  template: `
    <h1>Equipo</h1>
    <mc-lista-usuarios
      titulo="Usuarios de tu empresa"
      textoAlta="Agregar un empleado"
      [rolesNuevos]="roles()"
      [conMarcasDeEmpresa]="true"
      [puedeCrear]="esAdmin()"
    />
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
    }
  `,
})
export class Equipo {
  private readonly sesion = inject(SesionService).sesion;

  protected readonly esAdmin = computed(() => this.sesion()?.esAdminEmpresa === true);
  /** El rol de los empleados es el de la empresa (el mismo que el del usuario que ingresó). */
  protected readonly roles = computed<readonly RolUsuario[]>(() => {
    const rol = this.sesion()?.rol;
    return rol === undefined ? [] : [rol];
  });
}
