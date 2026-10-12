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
