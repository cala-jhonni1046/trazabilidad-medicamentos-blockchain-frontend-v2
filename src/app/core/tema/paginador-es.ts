import { Injectable, Provider } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';

/** Textos del paginador de Material en español. */
@Injectable()
class PaginadorEs extends MatPaginatorIntl {
  override itemsPerPageLabel = 'Por página';
  override nextPageLabel = 'Página siguiente';
  override previousPageLabel = 'Página anterior';
  override firstPageLabel = 'Primera página';
  override lastPageLabel = 'Última página';
  override getRangeLabel = (pagina: number, tamano: number, total: number): string => {
    if (total === 0) {
      return '0 de 0';
    }
    const desde = pagina * tamano + 1;
    const hasta = Math.min(total, desde + tamano - 1);
    return `${desde}–${hasta} de ${total}`;
  };
}

/** Suma el paginador en español a los `providers` de un componente con listas paginadas. */
export function proveerPaginadorEs(): Provider[] {
  return [{ provide: MatPaginatorIntl, useClass: PaginadorEs }];
}
