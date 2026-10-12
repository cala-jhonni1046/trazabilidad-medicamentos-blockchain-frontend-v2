import { HttpErrorResponse } from '@angular/common/http';
import { ErrorCampoDto, ErrorResponseDto } from '../api/modelos';

/** Mensaje cuando el backend no respondió: red caída, backend apagado o proxy sin destino. */
export const MENSAJE_SIN_CONEXION = 'No hay conexión con el servidor. Revisá tu conexión y probá de nuevo.';

/** Mensaje para un error 5xx que no trae un ErrorResponseDTO. */
export const MENSAJE_ERROR_DEL_SERVIDOR = 'El servidor tuvo un problema. Probá de nuevo en unos minutos.';

/**
 * Status que, sin un ErrorResponseDTO en el cuerpo, significan que el backend no respondió:
 * 0 (el navegador no obtuvo respuesta) y 502/504 (el proxy o un gateway no llegó al backend;
 * con el backend apagado, el proxy de `ng serve` responde 502 con el cuerpo vacío).
 */
const STATUS_SIN_CONEXION: readonly number[] = [0, 502, 504];

/**
 * Error de la API ya interpretado, listo para mostrar.
 *
 * Extiende `Error` para poder relanzarse (desde el interceptor) y reconocerse con
 * `instanceof`. Los textos vienen del backend tal cual: el frontend no los reinterpreta.
 */
export class ErrorApi extends Error {
  /** Código HTTP de la respuesta (0 si no hubo respuesta). */
  readonly status: number;
  /** Mensaje para la persona: el `message` del backend, o uno genérico si no vino. */
  readonly mensaje: string;
  /** Código de la regla incumplida: solo en 409 (R1–R15, TRANSICION_INVALIDA…); null en el resto. */
  readonly regla: string | null;
  /** Errores por campo: solo en el 400 de validación; vacío en el resto. */
  readonly campos: readonly ErrorCampoDto[];

  constructor(status: number, mensaje: string, regla: string | null, campos: readonly ErrorCampoDto[]) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.status = status;
    this.mensaje = mensaje;
    this.regla = regla;
    this.campos = campos;
  }
}

/**
 * Convierte una respuesta de error de HttpClient en un {@link ErrorApi}.
 *
 * - Si el cuerpo es un ErrorResponseDTO (objeto, o texto con ese JSON), se usan su
 *   `message`, `regla` y `errors` tal cual.
 * - Si no: 0, 502 y 504 → sin conexión; otro 5xx → error del servidor; el resto →
 *   mensaje genérico con el status.
 *
 * Un cuerpo `Blob` (descargas con `responseType: 'blob'`, como el PDF de habilitación)
 * no se puede leer de forma sincrónica: cae en el mensaje genérico.
 */
export function parsearErrorApi(respuesta: HttpErrorResponse): ErrorApi {
  const cuerpo = leerErrorResponseDto(respuesta.error);
  if (cuerpo !== null) {
    return new ErrorApi(respuesta.status, cuerpo.message, cuerpo.regla ?? null, cuerpo.errors ?? []);
  }
  return new ErrorApi(respuesta.status, mensajeGenerico(respuesta.status), null, []);
}

/** Devuelve el cuerpo como ErrorResponseDTO, o null si no tiene esa forma. */
function leerErrorResponseDto(cuerpo: unknown): ErrorResponseDto | null {
  const valor = typeof cuerpo === 'string' ? parsearJsonOpcional(cuerpo) : cuerpo;
  return esErrorResponseDto(valor) ? valor : null;
}

/** JSON.parse que devuelve null en lugar de lanzar si el texto no es JSON. */
function parsearJsonOpcional(texto: string): unknown {
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

/** Forma mínima de un ErrorResponseDTO: `status` numérico y `message` de texto. */
function esErrorResponseDto(valor: unknown): valor is ErrorResponseDto {
  if (typeof valor !== 'object' || valor === null) {
    return false;
  }
  const objeto = valor as Record<string, unknown>;
  return typeof objeto['status'] === 'number' && typeof objeto['message'] === 'string';
}

/** Mensaje cuando la respuesta no trae un ErrorResponseDTO. */
function mensajeGenerico(status: number): string {
  if (STATUS_SIN_CONEXION.includes(status)) {
    return MENSAJE_SIN_CONEXION;
  }
  if (status >= 500) {
    return MENSAJE_ERROR_DEL_SERVIDOR;
  }
  return `No se pudo completar la operación (error ${status}).`;
}
