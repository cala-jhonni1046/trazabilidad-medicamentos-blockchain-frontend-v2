import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Icono } from '../../shared/ui/icono';
import { SesionService } from '../auth/sesion.service';
import { SelectorTema } from '../tema/selector-tema';
import { AvisoEmpresa } from './aviso-empresa';
import { EmpresaPropiaDatos } from './empresa-propia.datos';
import { MENU_POR_ROL, ROTULO_ROL } from './navegacion';

/**
 * Marco de las pantallas de una persona con sesión: barra lateral con el menú de su rol,
 * sus datos y "Salir"; arriba, el tema; y el aviso si su empresa no está habilitada.
 */
@Component({
  selector: 'mc-shell-app',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AvisoEmpresa, Icono, RouterLink, RouterLinkActive, RouterOutlet, SelectorTema],
  providers: [EmpresaPropiaDatos],
  templateUrl: './shell-app.html',
  styleUrl: './shell-app.scss',
})
export class ShellApp {
  private readonly servicioSesion = inject(SesionService);
  protected readonly datosEmpresa = inject(EmpresaPropiaDatos);

  protected readonly sesion = this.servicioSesion.sesion;
  protected readonly menu = computed(() => {
    const sesion = this.sesion();
    return sesion === null ? [] : MENU_POR_ROL[sesion.rol];
  });
  protected readonly rotuloRol = computed(() => {
    const sesion = this.sesion();
    return sesion === null ? '' : ROTULO_ROL[sesion.rol];
  });

  /** Cierra la sesión y vuelve a la pantalla de ingreso. */
  protected salir(): void {
    this.servicioSesion.finalizarSesion('salida');
  }
}
