import { ROL_USUARIO } from '../api/modelos';
import { RUTA_INICIO_POR_ROL } from '../auth/rutas-sesion';
import { MENU_POR_ROL, ROTULO_ROL } from './navegacion';

describe('navegación', () => {
  it.each([...ROL_USUARIO])('%s tiene rótulo y un menú que empieza por su inicio', (rol) => {
    expect(ROTULO_ROL[rol].length).toBeGreaterThan(0);
    expect(MENU_POR_ROL[rol][0].ruta).toBe(RUTA_INICIO_POR_ROL[rol]);
  });

  it('las rutas de un menú no se repiten', () => {
    for (const rol of ROL_USUARIO) {
      const rutas = MENU_POR_ROL[rol].map((elemento) => elemento.ruta);
      expect(new Set(rutas).size).toBe(rutas.length);
    }
  });
});
