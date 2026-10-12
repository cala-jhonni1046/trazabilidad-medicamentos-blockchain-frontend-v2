import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { firstValueFrom } from 'rxjs';
import { ESTADO_INSPECTOR, EstadoInspector } from '../../../core/api/modelos';
import { AvisosService } from '../../../core/errores/avisos.service';
import { ListaPaginada } from '../../../core/listas/lista-paginada';
import { proveerPaginadorEs } from '../../../core/tema/paginador-es';
import { PRESENTACION_ESTADO_INSPECTOR, opcionesDeEstado } from '../../../shared/estados/catalogo-estados';
import { Estado } from '../../../shared/estados/estado';
import { ROTULO_PROVINCIA } from '../../../shared/formato/etiquetas';
import { FechaHoraPipe } from '../../../shared/formato/pipes-fechas';
import { ErrorApiComponente } from '../../../shared/ui/error-api';
import { EjecutorAcciones } from '../../../shared/ui/ejecutor-acciones';
import { FiltroEstado } from '../../../shared/ui/filtro-estado';
import { Icono } from '../../../shared/ui/icono';
import { Tarjeta } from '../../../shared/ui/tarjeta';
import { DialogoNuevoInspector } from './dialogo-nuevo-inspector';
import { InspectorVista, InspectoresDatos } from './inspectores.datos';

/** Pantalla "Inspectores" de la Sede: alta, baja y reactivación (solo la Sede puede, R1). */
@Component({
  selector: 'mc-inspectores',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ErrorApiComponente, Estado, FechaHoraPipe, FiltroEstado, Icono, MatButtonModule, MatPaginatorModule, Tarjeta],
  providers: [...proveerPaginadorEs()],
  templateUrl: './inspectores.html',
})
export class Inspectores {
  private readonly datos = inject(InspectoresDatos);
  private readonly ejecutor = inject(EjecutorAcciones);
  private readonly dialogo = inject(MatDialog);
  private readonly avisos = inject(AvisosService);

  protected readonly presentacion = PRESENTACION_ESTADO_INSPECTOR;
  protected readonly opciones = opcionesDeEstado(ESTADO_INSPECTOR, PRESENTACION_ESTADO_INSPECTOR);
  protected readonly rotuloProvincia = ROTULO_PROVINCIA;

  protected readonly lista = new ListaPaginada<InspectorVista, EstadoInspector | null>(null, ({ pagina, tamano, filtro }) =>
    this.datos.listar({ page: pagina, size: tamano, ...(filtro === null ? {} : { estado: filtro }) }),
  );

  protected readonly ocupada = signal(false);

  protected cambiarPagina(evento: PageEvent): void {
    this.lista.irA(evento.pageIndex, evento.pageSize);
  }

  protected async darDeAlta(): Promise<void> {
    const referencia = this.dialogo.open<DialogoNuevoInspector, undefined, boolean>(DialogoNuevoInspector, { width: 'min(640px, 95vw)' });
    if ((await firstValueFrom(referencia.afterClosed())) === true) {
      this.avisos.mostrarExito('Inspector dado de alta.');
      this.lista.recargar();
    }
  }

  protected async baja(v: InspectorVista): Promise<void> {
    this.ocupada.set(true);
    const hecho = await this.ejecutor.conDialogo(
      {
        titulo: 'Dar de baja al inspector',
        detalle: `${v.nombre ?? v.inspector.legajo} · ${v.inspector.legajo}`,
        aviso: 'Su cuenta queda inactiva y sus solicitudes tomadas vuelven a la bandeja.',
        boton: 'Dar de baja',
        accion: () => this.datos.darDeBaja(v.inspector.id),
      },
      'Inspector dado de baja.',
    );
    if (hecho) {
      this.lista.recargar();
    }
    this.ocupada.set(false);
  }

  protected async reactivar(v: InspectorVista): Promise<void> {
    this.ocupada.set(true);
    const hecho = await this.ejecutor.conDialogo(
      {
        titulo: 'Reactivar al inspector',
        detalle: `${v.nombre ?? v.inspector.legajo} · ${v.inspector.legajo}`,
        aviso: 'Su cuenta vuelve a estar activa, pero no recupera las solicitudes que tenía.',
        boton: 'Reactivar',
        accion: () => this.datos.reactivar(v.inspector.id),
      },
      'Inspector reactivado.',
    );
    if (hecho) {
      this.lista.recargar();
    }
    this.ocupada.set(false);
  }
}
