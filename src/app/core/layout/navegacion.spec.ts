import { ROL_USUARIO } from '../api/modelos';
import { RUTA_INICIO_POR_ROL } from '../auth/rutas-sesion';
import { ElementoMenu, MENU_POR_ROL, ROTULO_ROL, resaltarSoloSiEsExacta } from './navegacion';

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

  it('solo es exacta la entrada cuya ruta es prefijo de otra del mismo menú (el inicio del rol)', () => {
    for (const rol of ROL_USUARIO) {
      const menu = MENU_POR_ROL[rol];
      const exactas = menu.filter((elemento) => resaltarSoloSiEsExacta(elemento, menu)).map((elemento) => elemento.ruta);
      const prefijos = menu.filter((a) => menu.some((b) => b.ruta.startsWith(`${a.ruta}/`))).map((a) => a.ruta);
      expect(exactas).toEqual(prefijos);
    }
    const menu: readonly ElementoMenu[] = MENU_POR_ROL.FARMACIA;
    expect(resaltarSoloSiEsExacta(menu[0], menu)).toBe(true);
    expect(resaltarSoloSiEsExacta(menu[2], menu)).toBe(false);
  });
});
