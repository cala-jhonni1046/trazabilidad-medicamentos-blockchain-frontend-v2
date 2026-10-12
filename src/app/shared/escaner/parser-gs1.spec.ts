import { leerCodigoPegado, parsearGs1 } from './parser-gs1';

const GS = '\x1D';

describe('parsearGs1', () => {
  it('formato con paréntesis', () => {
    expect(parsearGs1('(01)07799000001010(21)L20260001S000001')).toEqual({
      gtin: '07799000001010',
      serie: 'L20260001S000001',
      lote: null,
      vencimiento: null,
    });
  });

  it('formato con paréntesis completo: vencimiento, lote y serie', () => {
    expect(parsearGs1('(01)07799000001010(17)271231(10)L2026-0001(21)ABC123')).toEqual({
      gtin: '07799000001010',
      serie: 'ABC123',
      lote: 'L2026-0001',
      vencimiento: '271231',
    });
  });

  it('crudo de pistola USB: el lote (variable) termina en GS y la serie al final', () => {
    const crudo = `010779900000101017271231${'10'}L2026-0001${GS}21L20260001S000001`;
    expect(parsearGs1(crudo)).toEqual({
      gtin: '07799000001010',
      serie: 'L20260001S000001',
      lote: 'L2026-0001',
      vencimiento: '271231',
    });
  });

  it('crudo con GTIN y serie solamente', () => {
    const resultado = parsearGs1('010779900000101021L20260001S000001');
    expect(resultado?.gtin).toBe('07799000001010');
    expect(resultado?.serie).toBe('L20260001S000001');
  });

  it('con el prefijo de simbología ]d2 y el GS al principio', () => {
    expect(parsearGs1(`]d2${GS}010779900000101021S1`)?.serie).toBe('S1');
    expect(parsearGs1(']d2(01)07799000001010(21)S1')?.serie).toBe('S1');
  });

  it('ignora espacios alrededor y GS sueltos dentro de un código con paréntesis', () => {
    expect(parsearGs1(`  (01)07799000001010(21)S1${GS} \n`)?.serie).toBe('S1');
  });

  it('no valida el dígito verificador: eso lo decide la API', () => {
    expect(parsearGs1('(01)07799000009999(21)X1')?.gtin).toBe('07799000009999');
  });

  it.each([
    ['vacío', ''],
    ['solo espacios', '   '],
    ['texto cualquiera', 'hola mundo'],
    ['sin serie', '(01)07799000001010'],
    ['sin GTIN', '(21)ABC123'],
    ['GTIN de largo incorrecto', '(01)123(21)ABC'],
    ['GTIN con letras', '(01)0779900000101A(21)ABC'],
    ['paréntesis mal cerrados', '(01)07799000001010(21'],
    ['basura entre campos', '(01)07799000001010[x](21)ABC'],
    ['AI desconocido en crudo', '9912345'],
  ])('devuelve null para %s', (_descripcion, texto) => {
    expect(parsearGs1(texto)).toBeNull();
  });

  it('el valor de la serie se corta en el máximo de 20 caracteres (crudo)', () => {
    const serie = parsearGs1(`010779900000101021${'A'.repeat(30)}`)?.serie;
    expect(serie).toBe('A'.repeat(20));
  });
});

describe('leerCodigoPegado', () => {
  it('lee un código GS1', () => {
    expect(leerCodigoPegado('(01)07799000001010(21)L20260001S000001')).toEqual({
      gtin: '07799000001010',
      serie: 'L20260001S000001',
    });
  });

  it.each(['07799000001010 L20260001S000001', '07799000001010,L20260001S000001', '07799000001010\tL20260001S000001', '  07799000001010 ; L20260001S000001 '])(
    'lee "GTIN serie" separado por espacio, coma, punto y coma o tabulación (%j)',
    (texto) => {
      expect(leerCodigoPegado(texto)).toEqual({ gtin: '07799000001010', serie: 'L20260001S000001' });
    },
  );

  it.each(['', 'hola', '07799000001010', '123 ABC', '07799000001010 serie con espacios'])(
    'devuelve null para %j',
    (texto) => {
      expect(leerCodigoPegado(texto)).toBeNull();
    },
  );
});
