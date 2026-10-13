# Pedidos al backend (paso B12): qué se hizo y qué sigue

El backend cerró B12 (`~/con-blockchain`, commits B12a a B12g) y el frontend adoptó el contrato nuevo (`Paso F14` a `F16`).
Los rodeos marcados `// TODO B12` se quitaron. Esto queda como registro y como lista de lo que todavía se pide.

## Hecho

| # | Pedido | Resultado |
|---|---|---|
| 1 | `AnclajeDTO.estado` como enum | `EstadoAnclajeCaja`; catálogo exhaustivo `PRESENTACION_ESTADO_ANCLAJE_CAJA` |
| 2 | `EtapaRecorridoDTO.etapa` como enum | `EtapaRecorrido`; `ROTULO_ETAPA_RECORRIDO` |
| 3 | Nulables como `anyOf [$ref, null]` | El cliente los tipa `T \| null` |
| 4 | PDF con `format: binary` | El cliente devuelve `Blob`; se quitó la conversión |
| 5 | Tamaño máximo de página (100) | `maximum: 100` en cada `size` (más de 100 no da 400: se recorta) |
| 6 | Nombre del inspector | `nombre` y `apellido` en el DTO; ya no se pide el usuario |
| 7 | Nombres en lugar de ids | Razones sociales, código del lote, medicamento…; se borró `NombresService` |
| 8 | `?estado=` en cajas y viajes | Stock en dos tarjetas (En stock / En camino); filtro en Viajes; "En camino hacia vos" |
| 9 | Trazabilidad por código | Pantalla **Trazabilidad** para todos los roles menos el paciente |
| 10 | Resumen del tablero | `GET /api/tablero/resumen`: un pedido en lugar de siete |
| 11 | Códigos y nombres en medidas, lotes, cajas, bultos | Vienen en los DTO (los eventos no traen nombre de actor y no se muestran ids: R13) |
| 12 | Contadores de la bandeja del inspector | `GET /api/tablero/bandeja-inspector`: insignias en el menú del inspector |
| 14 | `EmpresaResumenDTO` con campos obligatorios | Hecho en el contrato |
| 15c, 16 | Búsqueda por código de lote/bulto y por serie | El backend ya tiene `?codigo=` (lotes y bultos) y `?serie=` (cajas). **El frontend todavía no lo usa** en los formularios de armado y de viaje ni en Stock (se siguen ofreciendo hasta 100 elegibles). |
| — | `destinoId` del bulto es el id del **circuito** | Se muestran `circuitoCodigo`, `distribuidorRazonSocial` y `farmaciaRazonSocial` |

## Pendiente (backend)

- **13. `regla` como enum.** `ErrorResponseDTO.regla` es texto (R1–R15 y los códigos que no son R); está documentado, no es un enum.
- **15a. Bultos de un viaje con varias paradas.** Una farmacia con una parada ve todos los códigos de bulto del viaje y las
  demás paradas (el backend lo anotó como posible fuga de alcance, sin decidir). El frontend muestra lo que llega.
- **15b. Más de 100 lecturas de temperatura de un viaje.** Se piden de a 100 por página; un viaje largo podría tener más.
- **17. Dispensaciones:** sin búsqueda ni filtro de anuladas. "Mis reportes" del paciente reutiliza el listado del inspector.
- **Provincia de la farmacia en el circuito sin inspector.** El tablero de la Sede ya no muestra "Farmacia en <provincia>" porque el
  DTO del circuito no la trae (antes salía de pedir la empresa). Si se quiere, pedir `farmaciaProvincia` en `EnlaceCuitResponseDTO`.
- **18. CSP para el Docker final.** El escáner usa WebAssembly (`/zxing/zxing_reader.wasm`): el servidor web que sirva el
  frontend necesita `'wasm-unsafe-eval'` en `script-src`. (El Docker se hace al final.)
