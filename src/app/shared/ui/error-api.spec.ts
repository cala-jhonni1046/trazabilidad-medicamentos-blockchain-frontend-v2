import { TestBed } from '@angular/core/testing';
import { ErrorApi } from '../../core/errores/error-api';
import { ErrorApiComponente } from './error-api';

describe('mc-error-api', () => {
  async function pintar(error: ErrorApi | null): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(ErrorApiComponente);
    fixture.componentRef.setInput('error', error);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('sin error no muestra nada', async () => {
    expect((await pintar(null)).querySelector('[role="alert"]')).toBeNull();
  });

  it('muestra el mensaje y, en un 409, el código de la regla', async () => {
    const raiz = await pintar(new ErrorApi(409, 'La caja ya fue dispensada', 'R11', []));

    expect(raiz.querySelector('[role="alert"]')?.textContent).toContain('La caja ya fue dispensada');
    expect(raiz.querySelector('.regla')?.textContent).toBe('R11');
  });

  it('sin regla no muestra el código', async () => {
    expect((await pintar(new ErrorApi(401, 'Credenciales inválidas', null, []))).querySelector('.regla')).toBeNull();
  });
});
