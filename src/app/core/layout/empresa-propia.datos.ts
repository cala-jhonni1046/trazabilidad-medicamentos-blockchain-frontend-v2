import { Injectable, Signal, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { EmpresasService } from '../api/generado/services/empresas.service';
import { EmpresaResponseDto } from '../api/modelos';
import { SesionService } from '../auth/sesion.service';

/**
 * Datos de la empresa del usuario (solo los roles de empresa tienen una), para mostrar
 * su estado de habilitación en el shell. Si la lectura falla, simplemente no hay aviso:
 * los errores globales ya los muestra el interceptor.
 */
@Injectable()
export class EmpresaPropiaDatos {
  private readonly sesion = inject(SesionService);
  private readonly empresas = inject(EmpresasService);

  private readonly recurso = rxResource<EmpresaResponseDto | null, string | null>({
    params: () => this.sesion.sesion()?.empresaId ?? null,
    stream: ({ params: empresaId }): Observable<EmpresaResponseDto | null> =>
      empresaId === null ? of(null) : this.empresas.obtenerEmpresa({ id: empresaId }),
    defaultValue: null,
  });

  /** La empresa del usuario, o null si no tiene, todavía carga o no se pudo leer. */
  readonly empresa: Signal<EmpresaResponseDto | null> = this.recurso.value;
}
