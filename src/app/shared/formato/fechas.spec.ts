import { conOffsetArgentina, formatearDia, formatearFechaHora } from './fechas';
import { DiaPipe, FechaHoraPipe } from './pipes-fechas';

describe('formatearDia', () => {
  it('parte el texto sin pasar por Date (no se corre de día)', () => {
    expect(formatearDia('2026-10-08')).toBe('08/10/2026');
    expect(formatearDia('2026-01-01')).toBe('01/01/2026');
    expect(formatearDia('2026-12-31')).toBe('31/12/2026');
  });

  it('un texto con otro formato vuelve tal cual', () => {
    expect(formatearDia('mañana')).toBe('mañana');
    expect(formatearDia('')).toBe('');
  });
});

describe('formatearFechaHora', () => {
  it('muestra un instante UTC en hora de Argentina (UTC-3)', () => {
    expect(formatearFechaHora('2026-10-08T18:00:00Z')).toBe('08/10/2026 15:00');
  });

  it('cruza de día: 01:30 UTC es el día anterior en Argentina', () => {
    expect(formatearFechaHora('2026-10-09T01:30:00Z')).toBe('08/10/2026 22:30');
  });

  it('acepta microsegundos, como los de auditoría del backend', () => {
    expect(formatearFechaHora('2026-10-08T14:49:09.734512Z')).toBe('08/10/2026 11:49');
  });

  it('un texto inválido vuelve tal cual', () => {
    expect(formatearFechaHora('no es una fecha')).toBe('no es una fecha');
  });
});

describe('conOffsetArgentina', () => {
  it('agrega -03:00 y los segundos', () => {
    expect(conOffsetArgentina('2026-10-08T15:00')).toBe('2026-10-08T15:00:00-03:00');
    expect(conOffsetArgentina('2026-12-01T18:00:30')).toBe('2026-12-01T18:00:30-03:00');
  });

  it('el resultado es el mismo instante que se muestra después', () => {
    const conOffset = conOffsetArgentina('2026-10-08T15:00') as string;
    expect(formatearFechaHora(new Date(conOffset).toISOString())).toBe('08/10/2026 15:00');
  });

  it('un texto sin la forma esperada devuelve null (por ejemplo, ya con offset)', () => {
    expect(conOffsetArgentina('2026-10-08T15:00:00-03:00')).toBeNull();
    expect(conOffsetArgentina('2026-10-08')).toBeNull();
    expect(conOffsetArgentina('')).toBeNull();
  });
});

describe('pipes de fechas', () => {
  it('dia y fechaHora formatean y tratan null/undefined como vacío', () => {
    expect(new DiaPipe().transform('2026-10-08')).toBe('08/10/2026');
    expect(new DiaPipe().transform(null)).toBe('');
    expect(new FechaHoraPipe().transform('2026-10-08T18:00:00Z')).toBe('08/10/2026 15:00');
    expect(new FechaHoraPipe().transform(undefined)).toBe('');
  });
});
