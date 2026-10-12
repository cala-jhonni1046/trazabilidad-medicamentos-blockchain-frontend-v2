import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ListaUsuarios } from '../../comun/usuarios/lista-usuarios';

/** "Usuarios" de la Sede: ve los usuarios y crea cuentas de la Sede Central (R1: solo ella da altas de este tipo). */
@Component({
  selector: 'mc-usuarios-sede',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ListaUsuarios],
  template: `
    <h1>Usuarios</h1>
    <mc-lista-usuarios titulo="Usuarios del sistema" [rolesNuevos]="['SEDE_CENTRAL']" textoAlta="Crear usuario de la Sede" />
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
    }
  `,
})
export class UsuariosSede {}
