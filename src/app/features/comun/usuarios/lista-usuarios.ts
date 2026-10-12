import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { firstValueFrom } from 'rxjs';
import { UsuariosService } from '../../../core/api/generado/services/usuarios.service';
import { RolUsuario, UsuarioResponseDto } from '../../../core/api/modelos';
import { AvisosService } from '../../../core/errores/avisos.service';
import { ListaPaginada } from '../../../core/listas/lista-paginada';
import { proveerPaginadorEs } from '../../../core/tema/paginador-es';
import { ROTULO_ROL } from '../../../core/layout/navegacion';
import { FechaHoraPipe } from '../../../shared/formato/pipes-fechas';
import { ErrorApiComponente } from '../../../shared/ui/error-api';
import { Icono } from '../../../shared/ui/icono';
import { Tarjeta } from '../../../shared/ui/tarjeta';
import { DatosDialogoNuevoUsuario, DialogoNuevoUsuario } from './dialogo-nuevo-usuario';

/**
 * Listado de usuarios y alta (la Sede crea usuarios de la Sede; el administrador de una
 * empresa, empleados). Qué se puede crear lo decide la API; acá se ofrecen los roles del caso.
 */
@Component({
  selector: 'mc-lista-usuarios',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ErrorApiComponente, FechaHoraPipe, Icono, MatButtonModule, MatPaginatorModule, Tarjeta],
  providers: [...proveerPaginadorEs()],
  templateUrl: './lista-usuarios.html',
})
export class ListaUsuarios {
  private readonly api = inject(UsuariosService);
  private readonly dialogo = inject(MatDialog);
  private readonly avisos = inject(AvisosService);

  readonly titulo = input('Usuarios');
  /** Roles que se ofrecen al crear un usuario. */
  readonly rolesNuevos = input.required<readonly RolUsuario[]>();
  /** True para empresas: marcas de administrador y director técnico. */
  readonly conMarcasDeEmpresa = input(false);
  /** Texto del botón de alta. */
  readonly textoAlta = input('Crear usuario');
  /** Si se ofrece el botón de alta (la API igual decide quién puede crear). */
  readonly puedeCrear = input(true);

  protected readonly rotuloRol = ROTULO_ROL;
  protected readonly datosAlta = computed<DatosDialogoNuevoUsuario>(() => ({
    titulo: this.textoAlta(),
    roles: this.rolesNuevos().map((valor) => ({ valor, texto: ROTULO_ROL[valor] })),
    conMarcasDeEmpresa: this.conMarcasDeEmpresa(),
  }));

  protected readonly lista = new ListaPaginada<UsuarioResponseDto>(null, ({ pagina, tamano }) =>
    this.api.listarUsuarios({ page: pagina, size: tamano }),
  );

  protected cambiarPagina(evento: PageEvent): void {
    this.lista.irA(evento.pageIndex, evento.pageSize);
  }

  protected async crear(): Promise<void> {
    const referencia = this.dialogo.open<DialogoNuevoUsuario, DatosDialogoNuevoUsuario, boolean>(DialogoNuevoUsuario, {
      data: this.datosAlta(),
      width: 'min(640px, 95vw)',
    });
    if ((await firstValueFrom(referencia.afterClosed())) === true) {
      this.avisos.mostrarExito('Usuario creado.');
      this.lista.recargar();
    }
  }
}
