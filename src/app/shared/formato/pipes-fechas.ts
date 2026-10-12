import { Pipe, PipeTransform } from '@angular/core';
import { formatearDia, formatearFechaHora } from './fechas';

/** `{{ lote.fechaVencimiento | dia }}` → `08/10/2026` (día sin hora, sin correrse por zona horaria). */
@Pipe({ name: 'dia' })
export class DiaPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    return valor == null ? '' : formatearDia(valor);
  }
}

/** `{{ evento.fechaHora | fechaHora }}` → `08/10/2026 15:00`, en hora de Argentina. */
@Pipe({ name: 'fechaHora' })
export class FechaHoraPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    return valor == null ? '' : formatearFechaHora(valor);
  }
}
