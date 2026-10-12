import { LoginResponseDto } from '../api/modelos';
import { sesionDesdeLogin, sesionVencida } from './sesion.model';

describe('sesionDesdeLogin', () => {
  it('copia los datos del login y normaliza los opcionales a null', () => {
    const respuesta: LoginResponseDto = {
      token: 'token-de-prueba',
      tipo: 'Bearer',
      expiraEn: '2026-10-12T20:00:00Z',
      usuarioId: '00000000-0000-4000-8000-000000000001',
      nombre: 'Ana Prueba',
      rol: 'SEDE_CENTRAL',
      esAdminEmpresa: false,
      esDirectorTecnico: false,
      // empresaId y provincia no vienen.
    };

    expect(sesionDesdeLogin(respuesta)).toEqual({
      token: 'token-de-prueba',
      expiraEn: '2026-10-12T20:00:00Z',
      usuarioId: '00000000-0000-4000-8000-000000000001',
      nombre: 'Ana Prueba',
      rol: 'SEDE_CENTRAL',
      empresaId: null,
      esAdminEmpresa: false,
      esDirectorTecnico: false,
      provincia: null,
    });
  });

  it('conserva la provincia del inspector y la empresa de un usuario de empresa', () => {
    const base = { token: 't', tipo: 'Bearer', expiraEn: '2026-10-12T20:00:00Z', usuarioId: 'u', nombre: 'N' };

    expect(
      sesionDesdeLogin({ ...base, rol: 'INSPECTOR', esAdminEmpresa: false, esDirectorTecnico: false, provincia: 'MENDOZA' })
        .provincia,
    ).toBe('MENDOZA');
    expect(
      sesionDesdeLogin({ ...base, rol: 'LABORATORIO', esAdminEmpresa: true, esDirectorTecnico: true, empresaId: 'e1' })
        .empresaId,
    ).toBe('e1');
  });
});

describe('sesionVencida', () => {
  const sesion = sesionDesdeLogin({
    token: 't',
    tipo: 'Bearer',
    expiraEn: '2026-10-12T20:00:00Z',
    usuarioId: 'u',
    nombre: 'N',
    rol: 'PACIENTE',
    esAdminEmpresa: false,
    esDirectorTecnico: false,
  });

  it('vence exactamente a la hora de expiraEn', () => {
    expect(sesionVencida(sesion, Date.parse('2026-10-12T19:59:59.999Z'))).toBe(false);
    expect(sesionVencida(sesion, Date.parse('2026-10-12T20:00:00Z'))).toBe(true);
  });
});
