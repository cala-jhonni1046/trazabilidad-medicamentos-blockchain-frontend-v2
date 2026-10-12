import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Resultado } from '../../core/api/resultado';
import { AvisosService } from '../../core/errores/avisos.service';
import { ErrorApi } from '../../core/errores/error-api';
import { DatosDialogoAccion, abrirDialogoAccion } from './dialogo-accion';

/**
 * Ejecuta las acciones que modifican datos desde los listados:
 * - con confirmación (o pidiendo un motivo): abre el diálogo, que muestra el error de la API
 *   adentro si la acción se rechaza;
 * - directa (por ejemplo "Tomar"): sin diálogo; si la API la rechaza, el error (con su código
 *   de regla) se muestra tal cual en un aviso.
 * En los dos casos, si sale bien se confirma con un aviso. Devuelve true si se realizó.
 */
@Injectable({ providedIn: 'root' })
export class EjecutorAcciones {
  private readonly dialogo = inject(MatDialog);
  private readonly avisos = inject(AvisosService);

  /** Acción con diálogo (confirmación o con texto). */
  async conDialogo(datos: DatosDialogoAccion, mensajeExito: string): Promise<boolean> {
    const hecho = await abrirDialogoAccion(this.dialogo, datos);
    if (hecho) {
      this.avisos.mostrarExito(mensajeExito);
    }
    return hecho;
  }

  /** Acción sin diálogo. */
  async directa(accion: () => Promise<Resultado<unknown>>, mensajeExito: string): Promise<boolean> {
    const resultado = await accion();
    if (resultado.ok) {
      this.avisos.mostrarExito(mensajeExito);
      return true;
    }
    this.avisos.mostrarError(textoDeError(resultado.error));
    return false;
  }
}

/** "R11: La caja ya fue dispensada" o solo el mensaje si no hay código de regla. */
export function textoDeError(error: ErrorApi): string {
  return error.regla === null ? error.mensaje : `${error.regla}: ${error.mensaje}`;
}
