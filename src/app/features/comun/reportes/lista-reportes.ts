import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { RouterLink } from '@angular/router';
import { ReportesCiudadanosService } from '../../../core/api/generado/services/reportes-ciudadanos.service';
import {
  ESTADO_AUDITORIA,
  EstadoAuditoria,
  ReporteCiudadanoResponseDto,
  VerificacionPublicaResponseDto,
} from '../../../core/api/modelos';
import { SesionService } from '../../../core/auth/sesion.service';
import { ErrorApi } from '../../../core/errores/error-api';
import { ListaPaginada } from '../../../core/listas/lista-paginada';
import { proveerPaginadorEs } from '../../../core/tema/paginador-es';
import { PRESENTACION_ESTADO_REPORTE, opcionesDeEstado } from '../../../shared/estados/catalogo-estados';
import { Estado } from '../../../shared/estados/estado';
import { ROTULO_MOTIVO_REPORTE, ROTULO_PROVINCIA } from '../../../shared/formato/etiquetas';
import { FechaHoraPipe } from '../../../shared/formato/pipes-fechas';
import { ErrorApiComponente } from '../../../shared/ui/error-api';
import { FiltroEstado } from '../../../shared/ui/filtro-estado';
import { Tarjeta } from '../../../shared/ui/tarjeta';
import { ResultadoVerificacion } from '../../publico/verificar/resultado-verificacion';
import { VerificarDatos } from '../../publico/verificar/verificar.datos';
import { ReportesAcciones } from './reportes.acciones';

/** Qué reportes lista: los que ve el usuario, o la bandeja del inspector. */
export type ModoListaReportes = 'todos' | 'bandeja';

/**
 * Listado de reportes ciudadanos para el inspector: tomar, cerrar con conclusión, ver la caja
 * reportada (la misma verificación pública) y saltar a tomar medidas sobre el lote.
 * Muestra la descripción que escribió el paciente, pero no su identidad: la API no la entrega (R13).
 */
@Component({
  selector: 'mc-lista-reportes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ErrorApiComponente, Estado, FechaHoraPipe, FiltroEstado, MatButtonModule, MatPaginatorModule, ResultadoVerificacion, RouterLink, Tarjeta],
  providers: [VerificarDatos, ...proveerPaginadorEs()],
  templateUrl: './lista-reportes.html',
})
export class ListaReportes {
  private readonly api = inject(ReportesCiudadanosService);
  private readonly acciones = inject(ReportesAcciones);
  private readonly verificacion = inject(VerificarDatos);
  private readonly sesion = inject(SesionService);

  readonly modo = input<ModoListaReportes>('todos');
  readonly titulo = input('Reportes ciudadanos');

  protected readonly presentacion = PRESENTACION_ESTADO_REPORTE;
  protected readonly opciones = opcionesDeEstado(ESTADO_AUDITORIA, PRESENTACION_ESTADO_REPORTE);
  protected readonly rotuloMotivo = ROTULO_MOTIVO_REPORTE;
  protected readonly rotuloProvincia = ROTULO_PROVINCIA;
  protected readonly esInspector = computed(() => this.sesion.sesion()?.rol === 'INSPECTOR');

  protected readonly lista = new ListaPaginada<ReporteCiudadanoResponseDto, EstadoAuditoria | null>(null, ({ pagina, tamano, filtro }) =>
    this.modo() === 'bandeja'
      ? this.api.bandejaReportes({ page: pagina, size: tamano })
      : this.api.listarReportes({ page: pagina, size: tamano, ...(filtro === null ? {} : { estado: filtro }) }),
  );

  protected readonly ocupada = signal(false);

  /** Reporte cuya caja se está viendo, con lo que respondió la verificación. */
  protected readonly cajaAbierta = signal<{
    readonly id: string;
    readonly resultado: VerificacionPublicaResponseDto | null;
    readonly error: ErrorApi | null;
  } | null>(null);

  protected cambiarPagina(evento: PageEvent): void {
    this.lista.irA(evento.pageIndex, evento.pageSize);
  }

  protected async ejecutar(accion: Promise<boolean>): Promise<void> {
    this.ocupada.set(true);
    if (await accion) {
      this.lista.recargar();
    }
    this.ocupada.set(false);
  }

  protected tomar = (r: ReporteCiudadanoResponseDto) => this.ejecutar(this.acciones.tomar(r));
  protected cerrar = (r: ReporteCiudadanoResponseDto) => this.ejecutar(this.acciones.cerrar(r));

  /** Muestra u oculta el resultado de verificar la caja reportada. */
  protected async verCaja(reporte: ReporteCiudadanoResponseDto): Promise<void> {
    if (this.cajaAbierta()?.id === reporte.id) {
      this.cajaAbierta.set(null);
      return;
    }
    this.cajaAbierta.set({ id: reporte.id, resultado: null, error: null });
    const respuesta = await this.verificacion.verificar(reporte.gtinReportado, reporte.serieReportada);
    this.cajaAbierta.set(
      respuesta.ok ? { id: reporte.id, resultado: respuesta.valor, error: null } : { id: reporte.id, resultado: null, error: respuesta.error },
    );
  }
}
