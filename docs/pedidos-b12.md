# Pedidos al backend para el paso B12

Cosas que el frontend necesita o que mejorarían el contrato (`api/openapi.json`). El frontend
las resuelve mientras tanto con un rodeo, marcado en el código con `// TODO B12: …`.
Al cerrar B12, buscar `TODO B12` y quitar cada rodeo.

## Contrato (tipos)
1. **`AnclajeDTO.estado` como enum.** Hoy es `string` libre (valores vistos: `NO_DISPONIBLE`, y
   posiblemente los de `EstadoAnclaje`). Rodeo: `presentarEstadoAnclaje()` tolera cualquier valor
   (neutro, con el texto tal cual).
2. **`EtapaRecorridoDTO.etapa` como enum.** Hoy es `string` libre (valores vistos: `FABRICADO`,
   `LIBERADO`). Rodeo: se capitaliza el código para mostrarlo.
3. **Campos que pueden venir `null` declarados con `anyOf: [$ref, null]`** (hoy `{"type":"null","$ref":…}`),
   para que el generador los tipee como `T | null`. Rodeo: comparar con `== null`.
4. **`GET /api/empresas/{id}/documento` con `format: binary`** (hoy `format: byte`, que el generador
   tipea como `string`). Rodeo: conversión explícita del `Blob`.
5. **Tamaño máximo de página (100) declarado** (`maximum: 100`) en el parámetro `size`.
   Hoy está en `TAMANO_PAGINA_MAXIMO` tomado del CLAUDE.md del backend.

## Datos que faltan en los DTO
6. **Nombre del inspector** (nombre y apellido) en `InspectorAnmatResponseDTO`: para "asignar a…"
   y "revisor". Rodeo: caché de nombres con `obtenerUsuario`.
7. **Nombres en lugar de ids** (razón social, nombre comercial) en los DTO de listados. Rodeo:
   `NombresService` con caché.

## Endpoints y filtros
8. **`?estado=` en `listarCajas` y `listarViajes`** (stock EN_STOCK, viajes EN_TRANSITO que llegan).
   Rodeo: recorrer las páginas.
9. **Trazabilidad por código** (lote, bulto o serie, con sus eventos). Sin esto no hay pantalla
   de trazabilidad.

## Agregados durante el Lote A (Sede e inspector)
10. **Resumen para el tablero de la Sede** (un endpoint con los totales: empresas, pendientes, inspectores
    activos, circuitos aprobados, cuarentenas activas, eventos y anclajes). Hoy son 7 pedidos `size=1` que
    leen `page.totalElements` (`TableroDatos`).
11. **Códigos y nombres en medidas, lotes y eventos:** `CuarentenaResponseDTO` solo trae `loteId`/`bultoIds`
    (el listado busca el código del lote con `NombresService.lote`) y `EventoTrazabilidadResponseDTO` solo
    trae ids de actor y entidad (no se muestran). Va junto con los puntos 6 y 7.
12. **Contadores de la bandeja del inspector** (cuántas empresas, circuitos, biológicos, cuarentenas y
    reportes tiene pendientes) para mostrarlos en el menú. Hoy cada listado muestra su propio total y el
    menú no tiene insignias.
13. **`EtapaRecorridoDTO`, `AnclajeDTO.estado` y `ErrorResponseDTO.regla`:** que `regla` sea un enum
    documentado (R1–R15 y los códigos no-R). Hoy es `string` y el frontend lo muestra tal cual.

## Agregados durante el Lote B (laboratorio y distribuidora)
14. **`EmpresaResumenDTO` con campos obligatorios** (`razonSocial`, `provincia`, `id`, `cuit`, `tipo`): hoy
    ninguno es `required` y el generador los tipea opcionales (el formulario de circuitos los trata como tales).
15. **Viajes y recepción:** (a) `listarViajes` sin `?estado=` y sin saber cuáles bultos del viaje son de MI
    farmacia (punto 8): "En camino hacia vos" muestra todos los códigos del viaje; (b) las temperaturas del
    viaje se piden hasta 100 por página (un viaje largo puede tener más); (c) `listarBultos` y `listarLotes`
    sin búsqueda por código para los formularios de armado y de viaje (se ofrecen hasta 100 elegibles).
