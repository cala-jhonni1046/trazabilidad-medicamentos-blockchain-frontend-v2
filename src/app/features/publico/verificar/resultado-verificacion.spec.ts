import { TestBed } from '@angular/core/testing';
import { VerificacionPublicaResponseDto } from '../../../core/api/modelos';
import { ResultadoVerificacion } from './resultado-verificacion';

/** Respuesta base; cada test cambia lo que necesita. */
function respuesta(cambios: Partial<VerificacionPublicaResponseDto> = {}): VerificacionPublicaResponseDto {
  return {
    estado: 'EN_DISTRIBUCION',
    gtin: '07799000001010',
    serie: 'L20260001S000001',
    mensaje: 'Esta caja todavía no llegó a una farmacia. Si la tenés, denunciala.',
    producto: 'Cuyafen',
    principioActivo: 'Ibuprofeno',
    concentracion: '400 mg',
    presentacion: 'Caja x 20',
    laboratorio: 'Laboratorio Andino Cuyano S.A.',
    lote: 'L2026-0001',
    vencimiento: '2027-12-31',
    recorrido: [
      { etapa: 'FABRICADO', empresa: 'Laboratorio Andino Cuyano S.A.', fecha: '2026-01-15' },
      { etapa: 'LIBERADO', empresa: 'Laboratorio Andino Cuyano S.A.', fecha: '2026-10-08' },
    ],
    anclaje: null,
    ...cambios,
  } as VerificacionPublicaResponseDto;
}

async function pintar(valor: VerificacionPublicaResponseDto): Promise<HTMLElement> {
  const fixture = TestBed.createComponent(ResultadoVerificacion);
  fixture.componentRef.setInput('resultado', valor);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('mc-resultado-verificacion', () => {
  it('muestra estado, mensaje de la API tal cual, producto, lote, vencimiento (sin correr el día) y recorrido', async () => {
    const raiz = await pintar(respuesta());

    expect(raiz.querySelector('mc-estado')?.textContent).toContain('En distribución');
    expect(raiz.querySelector('.mensaje')?.textContent).toBe(
      'Esta caja todavía no llegó a una farmacia. Si la tenés, denunciala.',
    );
    expect(raiz.querySelector('h2')?.textContent).toContain('Cuyafen');
    expect(raiz.textContent).toContain('Ibuprofeno · 400 mg');
    expect(raiz.textContent).toContain('L2026-0001');
    expect(raiz.textContent).toContain('31/12/2027');
    const etapas = Array.from(raiz.querySelectorAll('.recorrido li')).map((li) =>
      Array.from(li.querySelectorAll('span')).map((span) => span.textContent?.trim()),
    );
    expect(etapas).toEqual([
      ['Fabricado', 'Laboratorio Andino Cuyano S.A.', '15/01/2026'],
      ['Liberado', 'Laboratorio Andino Cuyano S.A.', '08/10/2026'],
    ]);
  });

  it('NO_EXISTE: estado crítico, el mensaje de la API y sin recorrido', async () => {
    const raiz = await pintar(
      respuesta({
        estado: 'NO_EXISTE',
        mensaje: 'No encontramos esta caja: puede ser falsificada. No la consumas y denunciala.',
        lote: null,
        vencimiento: null,
        recorrido: [],
      }),
    );

    expect(raiz.querySelector('mc-estado')?.classList.contains('tono-critico')).toBe(true);
    expect(raiz.querySelector('.mensaje')?.textContent).toContain('puede ser falsificada');
    expect(raiz.querySelector('.recorrido')).toBeNull();
    expect(raiz.querySelector('.datos')?.textContent).not.toContain('Lote');
  });

  it('sin producto (GTIN desconocido) usa un título genérico', async () => {
    const raiz = await pintar(respuesta({ estado: 'NO_EXISTE', producto: null }));

    expect(raiz.querySelector('h2')?.textContent).toContain('Caja consultada');
  });

  it('anclaje NO_DISPONIBLE: neutro y sin enlace', async () => {
    const raiz = await pintar(
      respuesta({ anclaje: { estado: 'NO_DISPONIBLE', red: null, bloque: null, enlace: null, transactionHash: null } }),
    );

    const bloque = raiz.querySelector('.anclaje');
    expect(bloque?.querySelector('mc-estado')?.textContent).toContain('No disponible');
    expect(bloque?.querySelector('mc-estado')?.classList.contains('tono-neutro')).toBe(true);
    expect(bloque?.querySelector('a')).toBeNull();
  });

  it('anclaje CONFIRMADO: red, bloque, hash y enlace a Etherscan en pestaña nueva y con rel seguro', async () => {
    const raiz = await pintar(
      respuesta({
        anclaje: {
          estado: 'CONFIRMADO',
          red: 'Sepolia',
          bloque: 7654321,
          enlace: 'https://sepolia.etherscan.io/tx/0xabc',
          transactionHash: '0xabc',
        },
      }),
    );

    const bloque = raiz.querySelector('.anclaje') as HTMLElement;
    expect(bloque.textContent).toContain('Confirmado');
    expect(bloque.textContent).toContain('Sepolia');
    expect(bloque.textContent).toContain('7654321');
    expect(bloque.textContent).toContain('0xabc');
    const enlace = bloque.querySelector('a') as HTMLAnchorElement;
    expect(enlace.getAttribute('href')).toBe('https://sepolia.etherscan.io/tx/0xabc');
    expect(enlace.target).toBe('_blank');
    expect(enlace.rel).toBe('noopener noreferrer');
  });

  it('anclaje PENDIENTE (todavía no se ancló): tono de blockchain, sin enlace', async () => {
    const raiz = await pintar(
      respuesta({ anclaje: { estado: 'PENDIENTE', red: null, bloque: null, enlace: null, transactionHash: null } }),
    );

    expect(raiz.querySelector('.anclaje mc-estado')?.textContent).toContain('Pendiente de anclaje');
    expect(raiz.querySelector('.anclaje mc-estado')?.classList.contains('tono-blockchain')).toBe(true);
    expect(raiz.querySelector('.anclaje a')).toBeNull();
  });

  it('un enlace que no es https (por ejemplo javascript:) no se convierte en enlace', async () => {
    const raiz = await pintar(
      respuesta({
        anclaje: { estado: 'CONFIRMADO', red: 'Sepolia', bloque: 1, enlace: 'javascript:alert(1)', transactionHash: '0x1' },
      }),
    );

    expect(raiz.querySelector('.anclaje a')).toBeNull();
  });

  it('R13: solo se muestran los campos del contrato; un dato extra en la respuesta no aparece', async () => {
    const conExtras = { ...respuesta(), dni: '30456789', paciente: 'Juan Pérez', obraSocial: 'OSDE' };

    const raiz = await pintar(conExtras as VerificacionPublicaResponseDto);

    expect(raiz.textContent).not.toContain('30456789');
    expect(raiz.textContent).not.toContain('Juan Pérez');
    expect(raiz.textContent).not.toContain('OSDE');
  });
});
