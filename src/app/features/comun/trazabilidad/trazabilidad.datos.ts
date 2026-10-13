import { Injectable, inject } from '@angular/core';
import { EventosDeTrazabilidadService } from '../../../core/api/generado/services/eventos-de-trazabilidad.service';
import { RecorridoCodigoResponseDto } from '../../../core/api/modelos';
import { Resultado, aResultado } from '../../../core/api/resultado';

/** Qué se busca: UNO de estos tres (la API rechaza combinarlos con un 400). */
export type CriterioTrazabilidad =
  | { readonly tipo: 'CAJA'; readonly gtin: string; readonly serie: string }
  | { readonly tipo: 'BULTO'; readonly codigo: string }
  | { readonly tipo: 'LOTE'; readonly codigo: string };

/**
 * Acceso a la trazabilidad por código (GET /api/eventos-trazabilidad/recorrido). Es una acción disparada
 * por el botón, no una lectura que se recarga sola: devuelve un Resultado. El alcance (lo ajeno responde
 * 404) lo resuelve la API; acá no se filtra ni se decide nada.
 */
@Injectable()
export class TrazabilidadDatos {
  private readonly api = inject(EventosDeTrazabilidadService);

  /** Busca el lote, el bulto o la caja y devuelve sus eventos. */
  buscar(criterio: CriterioTrazabilidad): Promise<Resultado<RecorridoCodigoResponseDto>> {
    switch (criterio.tipo) {
      case 'CAJA':
        return aResultado(this.api.buscarRecorridoPorCodigo({ gtin: criterio.gtin, serie: criterio.serie }));
      case 'BULTO':
        return aResultado(this.api.buscarRecorridoPorCodigo({ bulto: criterio.codigo }));
      case 'LOTE':
        return aResultado(this.api.buscarRecorridoPorCodigo({ lote: criterio.codigo }));
    }
  }
}
