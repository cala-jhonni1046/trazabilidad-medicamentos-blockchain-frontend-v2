import { Injectable, inject } from '@angular/core';
import { CuarentenasService } from '../../../core/api/generado/services/cuarentenas.service';
import { CuarentenaResponseDto } from '../../../core/api/modelos';
import { aResultado } from '../../../core/api/resultado';
import { EjecutorAcciones } from '../../../shared/ui/ejecutor-acciones';

/**
 * Acciones del inspector sobre una medida sanitaria (cuarentena o recall): tomarla,
 * levantarla o convertirla en recall. La API decide si corresponde (R8, R9, R12, R14): por
 * ejemplo, una ruptura de frío no se puede levantar (409) y el error se muestra tal cual.
 */
@Injectable({ providedIn: 'root' })
export class MedidasAcciones {
  private readonly api = inject(CuarentenasService);
  private readonly ejecutor = inject(EjecutorAcciones);

  tomar(medida: CuarentenaResponseDto): Promise<boolean> {
    return this.ejecutor.directa(() => aResultado(this.api.tomarCuarentena({ id: medida.id })), 'Tomaste la medida.');
  }

  levantar(medida: CuarentenaResponseDto, detalle: string): Promise<boolean> {
    return this.ejecutor.conDialogo(
      {
        titulo: 'Levantar la medida',
        detalle,
        campo: { etiqueta: 'Fundamento', ayuda: 'Queda registrado en la cadena (solo su hash).' },
        boton: 'Levantar',
        accion: (fundamento) => aResultado(this.api.levantarCuarentena({ id: medida.id, body: { fundamento } })),
      },
      'Medida levantada.',
    );
  }

  recall(medida: CuarentenaResponseDto, detalle: string): Promise<boolean> {
    return this.ejecutor.conDialogo(
      {
        titulo: 'Convertir en recall',
        detalle,
        aviso: 'Es definitivo: las cajas quedan retiradas del mercado para siempre.',
        campo: { etiqueta: 'Fundamento', ayuda: 'Queda registrado en la cadena (solo su hash).' },
        boton: 'Convertir en recall',
        accion: (fundamento) => aResultado(this.api.convertirCuarentenaEnRecall({ id: medida.id, body: { fundamento } })),
      },
      'La medida pasó a recall.',
    );
  }
}
