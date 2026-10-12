import { Injectable, inject } from '@angular/core';
import { ReportesCiudadanosService } from '../../../core/api/generado/services/reportes-ciudadanos.service';
import { ReporteCiudadanoResponseDto } from '../../../core/api/modelos';
import { aResultado } from '../../../core/api/resultado';
import { EjecutorAcciones } from '../../../shared/ui/ejecutor-acciones';

/** Acciones del inspector sobre un reporte ciudadano: tomarlo y cerrarlo con su conclusión. */
@Injectable({ providedIn: 'root' })
export class ReportesAcciones {
  private readonly api = inject(ReportesCiudadanosService);
  private readonly ejecutor = inject(EjecutorAcciones);

  tomar(reporte: ReporteCiudadanoResponseDto): Promise<boolean> {
    return this.ejecutor.directa(() => aResultado(this.api.tomarReporte({ id: reporte.id })), `Tomaste el reporte ${reporte.codigo}.`);
  }

  cerrar(reporte: ReporteCiudadanoResponseDto): Promise<boolean> {
    return this.ejecutor.conDialogo(
      {
        titulo: 'Cerrar el caso',
        detalle: reporte.codigo,
        aviso: 'El paciente ve que el reporte se cerró, pero no la conclusión.',
        campo: { etiqueta: 'Conclusión de la investigación', filas: 4 },
        boton: 'Cerrar caso',
        accion: (conclusion) => aResultado(this.api.cerrarReporte({ id: reporte.id, body: { conclusion } })),
      },
      `Reporte ${reporte.codigo} cerrado.`,
    );
  }
}
