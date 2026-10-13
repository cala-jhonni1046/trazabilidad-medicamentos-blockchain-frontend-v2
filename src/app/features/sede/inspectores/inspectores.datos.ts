import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { InspectoresAnmatService } from '../../../core/api/generado/services/inspectores-anmat.service';
import { InspectorAnmatRequestDto, InspectorAnmatResponseDto } from '../../../core/api/modelos';
import { Pagina } from '../../../core/api/pagina';
import { Resultado, aResultado } from '../../../core/api/resultado';

/** Acceso a los inspectores: listado, alta, baja y reactivación (solo la Sede, R1). */
@Injectable({ providedIn: 'root' })
export class InspectoresDatos {
  private readonly api = inject(InspectoresAnmatService);

  /** Una página de inspectores (cada uno trae su nombre y apellido). */
  listar(parametros: { page: number; size: number; estado?: 'ACTIVO' | 'BAJA' }): Observable<Pagina<InspectorAnmatResponseDto>> {
    return this.api.listarInspectores(parametros);
  }

  crear(datos: InspectorAnmatRequestDto): Promise<Resultado<InspectorAnmatResponseDto>> {
    return aResultado(this.api.crearInspector({ body: datos }));
  }

  darDeBaja(id: string): Promise<Resultado<InspectorAnmatResponseDto>> {
    return aResultado(this.api.darDeBajaInspector({ id }));
  }

  reactivar(id: string): Promise<Resultado<InspectorAnmatResponseDto>> {
    return aResultado(this.api.reactivarInspector({ id }));
  }
}
