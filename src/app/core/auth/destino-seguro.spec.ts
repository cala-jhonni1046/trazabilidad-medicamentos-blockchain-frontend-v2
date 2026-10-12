import { destinoDespuesDeIngresar, mensajeDeMotivo } from './destino-seguro';

describe('destinoDespuesDeIngresar', () => {
  it('usa "volver" si es una ruta interna', () => {
    expect(destinoDespuesDeIngresar('/sede/empresas?pagina=2', 'SEDE_CENTRAL')).toBe('/sede/empresas?pagina=2');
  });

  it.each([null, '', 'sede', '//sitio-malo.com', '/\\sitio-malo.com', 'https://sitio-malo.com', '/ingresar?volver=/x'])(
    'sin "volver" válido (%s) va al inicio del rol',
    (volver) => {
      expect(destinoDespuesDeIngresar(volver, 'FARMACIA')).toBe('/farmacia');
    },
  );
});

describe('mensajeDeMotivo', () => {
  it('explica la sesión vencida y la rechazada; ignora cualquier otro valor', () => {
    expect(mensajeDeMotivo('vencida')).toContain('venció');
    expect(mensajeDeMotivo('rechazada')).toContain('ya no es válida');
    expect(mensajeDeMotivo('salida')).toBeNull();
    expect(mensajeDeMotivo(null)).toBeNull();
    expect(mensajeDeMotivo('<script>')).toBeNull();
  });
});
