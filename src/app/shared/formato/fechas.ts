// Fechas y horas de MediChain.
//
// - La API manda instantes en UTC con "Z" (2026-10-08T18:00:00Z): se muestran siempre en
//   America/Argentina/Buenos_Aires, sin depender de la zona del navegador.
// - Los días sueltos (YYYY-MM-DD: vencimiento, fabricación) NUNCA pasan por `new Date()`,
//   que los interpretaría en UTC y podría correrlos un día. Se parten como texto.
// - Hacia la API, una fecha con hora va siempre con offset (2026-10-08T15:00:00-03:00);
//   sin offset la API responde 400.

/** Zona horaria de la aplicación. */
export const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';

const PATRON_DIA = /^(\d{4})-(\d{2})-(\d{2})$/;
const PATRON_HORA_LOCAL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

/** Formateador de partes de fecha en la zona de la aplicación (se crea una sola vez). */
const PARTES = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONA_HORARIA,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

/** Partes numéricas (año, mes, día, hora, minuto, segundo) de un instante, en la zona de la aplicación. */
function partesEnZona(instanteMs: number): Record<string, number> {
  const partes: Record<string, number> = {};
  for (const parte of PARTES.formatToParts(new Date(instanteMs))) {
    if (parte.type !== 'literal') {
      partes[parte.type] = Number(parte.value);
    }
  }
  return partes;
}

/** Rellena con ceros a la izquierda hasta 2 dígitos. */
const dosDigitos = (n: number): string => String(n).padStart(2, '0');

/**
 * Un día `YYYY-MM-DD` como `DD/MM/YYYY`, partiendo el texto (sin `Date`).
 * Si el texto no tiene ese formato, lo devuelve tal cual.
 */
export function formatearDia(dia: string): string {
  const coincidencia = PATRON_DIA.exec(dia);
  return coincidencia === null ? dia : `${coincidencia[3]}/${coincidencia[2]}/${coincidencia[1]}`;
}

/**
 * Un instante ISO-8601 (UTC con Z) como `DD/MM/YYYY HH:mm` en hora de Argentina.
 * Si el texto no es una fecha válida, lo devuelve tal cual.
 */
export function formatearFechaHora(instante: string): string {
  const ms = Date.parse(instante);
  if (Number.isNaN(ms)) {
    return instante;
  }
  const p = partesEnZona(ms);
  return `${dosDigitos(p['day'])}/${dosDigitos(p['month'])}/${p['year']} ${dosDigitos(p['hour'])}:${dosDigitos(p['minute'])}`;
}

/** Desfase de la zona de la aplicación respecto de UTC en un instante, en minutos (Argentina: -180). */
function desfaseMinutos(instanteMs: number): number {
  const p = partesEnZona(instanteMs);
  const comoUtc = Date.UTC(p['year'], p['month'] - 1, p['day'], p['hour'], p['minute'], p['second']);
  return Math.round((comoUtc - Math.floor(instanteMs / 1000) * 1000) / 60000);
}

/**
 * Agrega a una fecha-hora local (`2026-10-08T15:00` o `…T15:00:30`) el offset de Argentina,
 * calculado con `Intl` (no escrito a mano): `2026-10-08T15:00:00-03:00`.
 * Es el formato que exige la API para las fechas con hora. Si el texto no tiene la forma
 * esperada, devuelve null.
 */
export function conOffsetArgentina(horaLocal: string): string | null {
  const c = PATRON_HORA_LOCAL.exec(horaLocal);
  if (c === null) {
    return null;
  }
  const [, anio, mes, dia, hora, minuto, segundo = '00'] = c;
  const comoUtc = Date.UTC(Number(anio), Number(mes) - 1, Number(dia), Number(hora), Number(minuto), Number(segundo));
  // Dos pasadas: el desfase depende del instante real, que a su vez depende del desfase.
  const primero = desfaseMinutos(comoUtc);
  const desfase = desfaseMinutos(comoUtc - primero * 60000);
  const signo = desfase < 0 ? '-' : '+';
  const absoluto = Math.abs(desfase);
  return `${anio}-${mes}-${dia}T${hora}:${minuto}:${segundo}${signo}${dosDigitos(Math.floor(absoluto / 60))}:${dosDigitos(absoluto % 60)}`;
}
