import { Injectable, inject } from '@angular/core';
import { VerificacionPublicaService } from '../../../core/api/generado/services/verificacion-publica.service';
import { VerificacionPublicaResponseDto } from '../../../core/api/modelos';
import { Resultado, aResultado } from '../../../core/api/resultado';

/**
 * Acceso a la verificación pública de una caja (GET /api/verificacion, sin token).
 * Es una acción disparada por el botón, no una lectura que se recarga sola: devuelve un
 * Resultado en lugar de un recurso.
 */
@Injectable()
export class VerificarDatos {
  private readonly verificacion = inject(VerificacionPublicaService);

  /** Consulta el estado de la caja identificada por GTIN + serie. */
  verificar(gtin: string, serie: string): Promise<Resultado<VerificacionPublicaResponseDto>> {
    return aResultado(this.verificacion.verificarCaja({ gtin, serie }));
  }
}
