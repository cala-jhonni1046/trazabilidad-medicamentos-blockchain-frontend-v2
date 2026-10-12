import { TestBed } from '@angular/core/testing';
import { EmpresaResponseDto, EstadoHabilitacion } from '../api/modelos';
import { AvisoEmpresa } from './aviso-empresa';

/** Empresa de prueba con el estado dado (solo los campos que usa el aviso). */
function empresa(estado: EstadoHabilitacion): EmpresaResponseDto {
  return { razonSocial: 'Farmacia del Sur S.A.', estado } as EmpresaResponseDto;
}

async function pintar(valor: EmpresaResponseDto | null): Promise<HTMLElement> {
  const fixture = TestBed.createComponent(AvisoEmpresa);
  fixture.componentRef.setInput('empresa', valor);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('mc-aviso-empresa', () => {
  it('con la empresa HABILITADA no muestra nada', async () => {
    expect((await pintar(empresa('HABILITADA'))).querySelector('[role="status"]')).toBeNull();
  });

  it('sin empresa no muestra nada', async () => {
    expect((await pintar(null)).querySelector('[role="status"]')).toBeNull();
  });

  it.each<[EstadoHabilitacion, string]>([
    ['PENDIENTE', 'pendiente'],
    ['RECHAZADA', 'rechazada'],
    ['SUSPENDIDA', 'suspendida'],
  ])('con la empresa %s muestra su estado y su nombre', async (estado, textoMinuscula) => {
    const raiz = await pintar(empresa(estado));
    const aviso = raiz.querySelector('[role="status"]');

    expect(aviso?.textContent).toContain('Farmacia del Sur S.A.');
    expect(aviso?.textContent).toContain(textoMinuscula);
    expect(aviso?.querySelector('mc-estado mat-icon')).not.toBeNull();
  });
});
