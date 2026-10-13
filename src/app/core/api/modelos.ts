/**
 * Único punto de import de los modelos y enums del contrato con el backend.
 *
 * Todo sale de `./generado` (ng-openapi-gen, desde api/openapi.json). El resto de
 * la aplicación importa desde este archivo, nunca desde `./generado`: así un cambio
 * del generador se absorbe en un solo lugar.
 */

// Interfaces de los DTO y tipos de los enums (por ejemplo LoteResponseDto, EstadoLote, Provincia).
export * from './generado/models';

// Lista de valores de cada enum, en el orden del contrato. El índice del generador
// exporta solo tipos, por eso cada array se re-exporta acá.
export { ALCANCE_CUARENTENA } from './generado/models/alcance-cuarentena-array';
export { CAUSA_BLOQUEO } from './generado/models/causa-bloqueo-array';
export { ESTADO_ANCLAJE } from './generado/models/estado-anclaje-array';
export { ESTADO_ANCLAJE_CAJA } from './generado/models/estado-anclaje-caja-array';
export { ESTADO_AUDITORIA } from './generado/models/estado-auditoria-array';
export { ESTADO_BULTO } from './generado/models/estado-bulto-array';
export { ESTADO_CUARENTENA } from './generado/models/estado-cuarentena-array';
export { ESTADO_DESPACHO } from './generado/models/estado-despacho-array';
export { ESTADO_ENLACE_CUIT } from './generado/models/estado-enlace-cuit-array';
export { ESTADO_HABILITACION } from './generado/models/estado-habilitacion-array';
export { ESTADO_INSPECTOR } from './generado/models/estado-inspector-array';
export { ESTADO_LOTE } from './generado/models/estado-lote-array';
export { ESTADO_UNIDAD } from './generado/models/estado-unidad-array';
export { ETAPA_RECORRIDO } from './generado/models/etapa-recorrido-array';
export { ESTADO_VERIFICACION } from './generado/models/estado-verificacion-array';
export { ESTADO_VERIFICACION_BLOCKCHAIN } from './generado/models/estado-verificacion-blockchain-array';
export { MOTIVO_BLOQUEO } from './generado/models/motivo-bloqueo-array';
export { MOTIVO_DEVOLUCION } from './generado/models/motivo-devolucion-array';
export { MOTIVO_REPORTE } from './generado/models/motivo-reporte-array';
export { ORIGEN_RECHAZO } from './generado/models/origen-rechazo-array';
export { PROVINCIA } from './generado/models/provincia-array';
export { ROL_USUARIO } from './generado/models/rol-usuario-array';
export { TIPO_EMPRESA } from './generado/models/tipo-empresa-array';
export { TIPO_EVENTO } from './generado/models/tipo-evento-array';
export { TIPO_MEDIDA } from './generado/models/tipo-medida-array';
export { TRAMO_DESPACHO } from './generado/models/tramo-despacho-array';
