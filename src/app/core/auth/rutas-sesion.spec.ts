import { ROL_USUARIO } from '../api/modelos';
import { RUTA_INICIO_POR_ROL } from './rutas-sesion';

describe('RUTA_INICIO_POR_ROL', () => {
  it('cada rol del contrato tiene un inicio propio, absoluto y distinto', () => {
    const rutas = ROL_USUARIO.map((rol) => RUTA_INICIO_POR_ROL[rol]);

    expect(rutas.every((ruta) => ruta.startsWith('/'))).toBe(true);
    expect(new Set(rutas).size).toBe(ROL_USUARIO.length);
  });
});
