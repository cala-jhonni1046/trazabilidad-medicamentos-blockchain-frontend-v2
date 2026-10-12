import { HttpTestingController, TestRequest } from '@angular/common/http/testing';

// Ayudas compartidas por los tests del tablero (no se importan desde la aplicación).

/** Un listado vacío del backend. */
export const PAGINA_VACIA = { content: [], page: { number: 0, size: 20, totalElements: 0, totalPages: 0 } };

/** Una página con los elementos dados y el total indicado. */
export function pagina(content: object[], totalElements = content.length): object {
  return { content, page: { number: 0, size: 20, totalElements, totalPages: 1 } };
}

/** Pedidos pendientes a esa ruta (con o sin filtro `estado`), para responderlos. */
export function pedidosA(http: HttpTestingController, url: string, estado?: string): TestRequest[] {
  return http.match((p) => p.url === url && (estado === undefined || p.params.get('estado') === estado));
}

/** Responde los 7 conteos del resumen con los números dados (por clave de mosaico). */
export function responderMosaicos(
  http: HttpTestingController,
  totales: Partial<Record<string, number>> = {},
  fallar: readonly string[] = [],
): void {
  const rutas: [string, string, string | undefined][] = [
    ['empresas', '/api/empresas', undefined],
    ['empresas-pendientes', '/api/empresas', 'PENDIENTE'],
    ['inspectores-activos', '/api/inspectores-anmat', 'ACTIVO'],
    ['circuitos-aprobados', '/api/circuitos', 'APROBADO'],
    ['cuarentenas-activas', '/api/cuarentenas', 'ACTIVA'],
    ['eventos', '/api/eventos-trazabilidad', undefined],
    ['anclajes', '/api/registros-blockchain', undefined],
  ];
  for (const [clave, url, estado] of rutas) {
    const pedido = http.match(
      (p) => p.url === url && p.params.get('size') === '1' && (estado === undefined ? !p.params.has('estado') : p.params.get('estado') === estado),
    )[0];
    if (fallar.includes(clave)) {
      pedido.flush({ status: 500, message: 'Error interno', regla: null, errors: null }, { status: 500, statusText: 'Server Error' });
    } else {
      pedido.flush({ content: [], page: { number: 0, size: 1, totalElements: totales[clave] ?? 0, totalPages: 0 } });
    }
  }
}
