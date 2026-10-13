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

/** Responde el resumen de la Sede (UN pedido) con los números dados; con `fallar`, con un 500. */
export function responderMosaicos(
  http: HttpTestingController,
  totales: Partial<Record<'empresas' | 'empresasPendientes' | 'inspectoresActivos' | 'circuitosAprobados' | 'cuarentenasActivas' | 'eventos' | 'anclajesConfirmados', number>> = {},
  fallar = false,
): void {
  const pedido = http.match((p) => p.url === '/api/tablero/resumen')[0];
  if (fallar) {
    pedido.flush({ status: 500, message: 'Error interno', regla: null, errors: null }, { status: 500, statusText: 'Server Error' });
    return;
  }
  pedido.flush({
    empresas: 0, empresasPendientes: 0, inspectoresActivos: 0, circuitosAprobados: 0, cuarentenasActivas: 0, eventos: 0, anclajesConfirmados: 0,
    ...totales,
  });
}
