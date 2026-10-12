import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { ErrorApi } from '../errores/error-api';
import { ListaPaginada } from './lista-paginada';

const pagina = (content: string[], total = content.length) => ({
  content,
  page: { number: 0, size: 10, totalElements: total, totalPages: 1 },
});

function crear<F>(filtro: F, cargar: ConstructorParameters<typeof ListaPaginada<string, F>>[1]) {
  return runInInjectionContext(TestBed.inject(Injector), () => new ListaPaginada<string, F>(filtro, cargar));
}

async function esperar(): Promise<void> {
  await vi.waitFor(() => TestBed.tick());
}

describe('ListaPaginada', () => {
  it('pide la primera página con el filtro inicial y expone elementos y total', async () => {
    const cargar = vi.fn().mockReturnValue(of(pagina(['a', 'b'], 12)));
    const lista = crear('TODOS', cargar);

    await vi.waitFor(() => {
      TestBed.tick();
      expect(lista.elementos()).toEqual(['a', 'b']);
    });
    expect(lista.total()).toBe(12);
    expect(cargar).toHaveBeenCalledWith({ pagina: 0, tamano: 10, filtro: 'TODOS' });
  });

  it('cambiar de página o filtrar vuelve a pedir; filtrar regresa a la primera página', async () => {
    const cargar = vi.fn().mockReturnValue(of(pagina(['x'])));
    const lista = crear('TODOS', cargar);
    await vi.waitFor(() => { TestBed.tick(); expect(lista.elementos().length).toBe(1); });

    lista.irA(2, 20);
    await vi.waitFor(() => { TestBed.tick(); expect(cargar).toHaveBeenLastCalledWith({ pagina: 2, tamano: 20, filtro: 'TODOS' }); });

    lista.filtrarPor('ACTIVO');
    await vi.waitFor(() => { TestBed.tick(); expect(cargar).toHaveBeenLastCalledWith({ pagina: 0, tamano: 20, filtro: 'ACTIVO' }); });
  });

  it('una lista sin elementos queda "vacía" (no "cargando")', async () => {
    const lista = crear(null, () => of(pagina([])));

    await vi.waitFor(() => { TestBed.tick(); expect(lista.vacia()).toBe(true); });
    expect(lista.error()).toBeNull();
  });

  it('un error se expone como ErrorApi, sin elementos, y no lanza al leer', async () => {
    const lista = crear(null, () => throwError(() => new ErrorApi(500, 'Error interno', null, [])));

    await vi.waitFor(() => { TestBed.tick(); expect(lista.error()?.mensaje).toBe('Error interno'); });
    expect(lista.elementos()).toEqual([]);
    expect(lista.vacia()).toBe(false);
  });

  it('mientras carga no está vacía ni tiene error', async () => {
    const pendiente = new Subject<ReturnType<typeof pagina>>();
    const lista = crear(null, () => pendiente);
    await esperar();

    expect(lista.cargando()).toBe(true);
    expect(lista.vacia()).toBe(false);
    expect(lista.error()).toBeNull();
  });
});
