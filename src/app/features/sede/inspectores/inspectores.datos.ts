import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { InspectoresAnmatService } from '../../../core/api/generado/services/inspectores-anmat.service';
import { InspectorAnmatRequestDto, InspectorAnmatResponseDto } from '../../../core/api/modelos';
import { Pagina } from '../../../core/api/pagina';
import { Resultado, aResultado } from '../../../core/api/resultado';
import { NombresService } from '../../../core/nombres/nombres.service';

/** Un inspector con su nombre ya buscado (null si no se pudo leer). */
export interface InspectorVista {
  readonly inspector: InspectorAnmatResponseDto;
  readonly nombre: string | null;
}

/** Acceso a los inspectores: listado con nombres, alta, baja y reactivación (solo la Sede, R1). */
@Injectable({ providedIn: 'root' })
export class InspectoresDatos {
  private readonly api = inject(InspectoresAnmatService);
  private readonly nombres = inject(NombresService);

  /**
   * Una página de inspectores, cada uno con su nombre.
   * TODO B12: que el inspector traiga su nombre (docs/pedidos-b12.md, punto 6).
   */
  listar(parametros: { page: number; size: number; estado?: 'ACTIVO' | 'BAJA' }): Observable<Pagina<InspectorVista>> {
    return this.api.listarInspectores(parametros).pipe(
      switchMap((pagina) => {
        if (pagina.content.length === 0) {
          return of<Pagina<InspectorVista>>({ content: [], page: pagina.page });
        }
        return forkJoin(
          pagina.content.map((inspector) =>
            this.nombres.nombreUsuario(inspector.usuarioId).pipe(map((nombre): InspectorVista => ({ inspector, nombre }))),
          ),
        ).pipe(map((content) => ({ content, page: pagina.page })));
      }),
    );
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
