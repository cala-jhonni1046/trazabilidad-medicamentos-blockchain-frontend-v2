import { PageMetadata } from './modelos';

/**
 * Página de un listado del backend: `{content, page}`.
 * Tiene la misma forma que cada `PagedModel…Dto` generado, así un componente o
 * servicio genérico (por ejemplo una tabla paginada) trabaja con cualquier listado.
 */
export interface Pagina<T> {
  /** Elementos de esta página. */
  content: T[];
  /** Número de página (desde 0), tamaño y totales. */
  page: PageMetadata;
}

/**
 * Parámetros de paginación comunes a todos los listados.
 * `page` empieza en 0; `sort` va como "campo,asc" o "campo,desc" (puede repetirse).
 */
export interface ParametrosPagina {
  page?: number;
  size?: number;
  sort?: string[];
}

/**
 * Tamaño máximo de página que acepta el backend.
 * El contrato no lo declara (solo `default 20, minimum 1`): sale del CLAUDE.md del
 * backend ("Listados paginados … máximo 100 por página").
 */
export const TAMANO_PAGINA_MAXIMO = 100;
