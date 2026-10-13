import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EmpresaResponseDto, EnlaceCuitResponseDto } from '../../../core/api/modelos';
import { AvisosService } from '../../../core/errores/avisos.service';
import { ROTULO_PROVINCIA, ROTULO_TIPO_EMPRESA } from '../../../shared/formato/etiquetas';
import { FechaHoraPipe } from '../../../shared/formato/pipes-fechas';
import { Icono } from '../../../shared/ui/icono';
import { Mosaico } from '../../../shared/ui/mosaico';
import { Tarjeta } from '../../../shared/ui/tarjeta';
import { DatosDialogoAsignar, DialogoAsignar } from './dialogo-asignar';
import { TableroDatos } from './tablero.datos';

/**
 * Tablero de la Sede Central: resumen en mosaicos y lo que la Sede tiene que asignar a mano
 * (solicitudes y circuitos de provincias sin inspector activo).
 */
@Component({
  selector: 'mc-tablero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FechaHoraPipe, Icono, MatButtonModule, Mosaico, RouterLink, Tarjeta],
  providers: [TableroDatos],
  templateUrl: './tablero.html',
  styleUrl: './tablero.scss',
})
export class Tablero {
  protected readonly datos = inject(TableroDatos);
  private readonly dialogo = inject(MatDialog);
  private readonly avisos = inject(AvisosService);

  protected readonly rotuloProvincia = ROTULO_PROVINCIA;
  protected readonly rotuloTipo = ROTULO_TIPO_EMPRESA;

  /** Abre el diálogo para asignar una solicitud de habilitación. */
  protected asignarEmpresa(empresa: EmpresaResponseDto): Promise<void> {
    return this.abrirDialogo({
      titulo: 'Asignar solicitud de habilitación',
      detalle: `${empresa.razonSocial} · ${ROTULO_TIPO_EMPRESA[empresa.tipo]} · ${ROTULO_PROVINCIA[empresa.provincia]}`,
      asignar: (inspectorId) => this.datos.asignarEmpresa(empresa.id, inspectorId),
    });
  }

  /** Abre el diálogo para asignar un circuito. */
  protected asignarCircuito(circuito: EnlaceCuitResponseDto): Promise<void> {
    return this.abrirDialogo({
      titulo: 'Asignar circuito',
      detalle: `${circuito.codigo} · ${circuito.laboratorioRazonSocial} → ${circuito.distribuidorRazonSocial} → ${circuito.farmaciaRazonSocial}`,
      asignar: (inspectorId) => this.datos.asignarCircuito(circuito.id, inspectorId),
    });
  }

  /** Abre el diálogo; si se asignó, avisa y recarga todo. */
  private async abrirDialogo(datos: Pick<DatosDialogoAsignar, 'titulo' | 'detalle' | 'asignar'>): Promise<void> {
    const referencia = this.dialogo.open<DialogoAsignar, DatosDialogoAsignar, string>(DialogoAsignar, {
      data: { ...datos, cargarInspectores: () => this.datos.cargarInspectores() },
      width: 'min(520px, 95vw)',
    });
    const inspector = await firstValueFrom(referencia.afterClosed());
    if (inspector !== undefined) {
      this.avisos.mostrarExito(inspector === '' ? 'Asignado.' : `Asignado a ${inspector}.`);
      this.datos.recargar();
    }
  }
}
