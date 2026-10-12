import { Injectable, inject } from '@angular/core';
import { ViajesService } from '../../../core/api/generado/services/viajes.service';
import { DespachoLogisticoResponseDto } from '../../../core/api/modelos';
import { aResultado } from '../../../core/api/resultado';
import { EjecutorAcciones } from '../../../shared/ui/ejecutor-acciones';

/**
 * Acciones de la empresa de origen sobre un viaje: registrar la salida, cancelarlo o reportar
 * un robo o extravío. La API decide si corresponde (R7, R10, R14): un bulto bloqueado (R10)
 * frena la salida con un 409 que se muestra tal cual.
 */
@Injectable({ providedIn: 'root' })
export class ViajesAcciones {
  private readonly api = inject(ViajesService);
  private readonly ejecutor = inject(EjecutorAcciones);

  salida(viaje: DespachoLogisticoResponseDto): Promise<boolean> {
    return this.ejecutor.conDialogo(
      {
        titulo: 'Registrar la salida',
        detalle: `${viaje.codigo} · patente ${viaje.patente}`,
        aviso: 'Los bultos y sus cajas pasan a estar en tránsito.',
        boton: 'Registrar salida',
        accion: () => aResultado(this.api.registrarSalidaViaje({ id: viaje.id })),
      },
      `Salió el viaje ${viaje.codigo}.`,
    );
  }

  cancelar(viaje: DespachoLogisticoResponseDto): Promise<boolean> {
    return this.ejecutor.conDialogo(
      {
        titulo: 'Cancelar el viaje',
        detalle: viaje.codigo,
        aviso: 'Sus bultos quedan sin viaje.',
        campo: { etiqueta: 'Motivo de la cancelación' },
        boton: 'Cancelar viaje',
        accion: (motivo) => aResultado(this.api.cancelarViaje({ id: viaje.id, body: { motivo } })),
      },
      `Viaje ${viaje.codigo} cancelado.`,
    );
  }

  robo(viaje: DespachoLogisticoResponseDto): Promise<boolean> {
    return this.ejecutor.conDialogo(
      {
        titulo: 'Reportar robo o extravío',
        detalle: viaje.codigo,
        aviso: 'Los bultos y las cajas quedan marcados como robados y se abre una cuarentena que no se puede levantar.',
        campo: { etiqueta: 'Qué pasó' },
        boton: 'Reportar robo',
        accion: (motivo) => aResultado(this.api.reportarRoboViaje({ id: viaje.id, body: { motivo } })),
      },
      `Robo del viaje ${viaje.codigo} reportado.`,
    );
  }
}
