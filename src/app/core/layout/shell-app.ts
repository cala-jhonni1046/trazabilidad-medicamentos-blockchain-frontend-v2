import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ROTULO_PROVINCIA } from '../../shared/formato/etiquetas';
import { Icono } from '../../shared/ui/icono';
import { SaltarAlContenido } from '../../shared/ui/saltar-al-contenido';
import { SesionService } from '../auth/sesion.service';
import { SelectorTema } from '../tema/selector-tema';
import { AvisoEmpresa } from './aviso-empresa';
import { EmpresaPropiaDatos } from './empresa-propia.datos';
import { ElementoMenu, MENU_POR_ROL, ROTULO_ROL, resaltarSoloSiEsExacta } from './navegacion';
import { PendientesInspector } from './pendientes-inspector';

/**
 * Marco de las pantallas de una persona con sesión: barra lateral con el menú de su rol,
 * sus datos y "Salir"; arriba, el tema; y el aviso si su empresa no está habilitada.
 */
@Component({
  selector: 'mc-shell-app',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AvisoEmpresa, Icono, RouterLink, RouterLinkActive, RouterOutlet, SaltarAlContenido, SelectorTema],
  providers: [EmpresaPropiaDatos, PendientesInspector],
  templateUrl: './shell-app.html',
  styleUrl: './shell-app.scss',
})
export class ShellApp {
  private readonly servicioSesion = inject(SesionService);
  protected readonly datosEmpresa = inject(EmpresaPropiaDatos);
  private readonly pendientes = inject(PendientesInspector);

  protected readonly sesion = this.servicioSesion.sesion;
  /**
   * Menú del rol, con la marca de qué entradas se resaltan solo con la ruta exacta (ver `resaltarSoloSiEsExacta`)
   * y, para el inspector, cuántos pendientes tiene cada una (`cantidad`, null si no aplica o todavía no hay datos).
   */
  protected readonly menu = computed((): readonly (ElementoMenu & { readonly exacta: boolean; readonly cantidad: number | null })[] => {
    const sesion = this.sesion();
    const entradas = sesion === null ? [] : MENU_POR_ROL[sesion.rol];
    return entradas.map((elemento) => ({
      ...elemento,
      exacta: resaltarSoloSiEsExacta(elemento, entradas),
      cantidad: elemento.pendientes === undefined ? null : this.pendientes.total(elemento.pendientes),
    }));
  });
  protected readonly rotuloRol = computed(() => {
    const sesion = this.sesion();
    return sesion === null ? '' : ROTULO_ROL[sesion.rol];
  });

  protected readonly rotuloProvincia = (provincia: keyof typeof ROTULO_PROVINCIA): string => ROTULO_PROVINCIA[provincia];

  /** Cierra la sesión y vuelve a la pantalla de ingreso. */
  protected salir(): void {
    this.servicioSesion.finalizarSesion('salida');
  }
}
