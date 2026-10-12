import { LoteResponseDto, PagedModelLoteResponseDto } from './modelos';
import { Pagina } from './pagina';

describe('Pagina<T>', () => {
  it('una página generada (PagedModel…Dto) se puede usar como Pagina<T>', () => {
    const generada: PagedModelLoteResponseDto = {
      content: [],
      page: { number: 0, size: 20, totalElements: 0, totalPages: 0 },
    };

    // Si el contrato cambiara la forma de las páginas, esta asignación dejaría de compilar.
    const pagina: Pagina<LoteResponseDto> = generada;

    expect(pagina.page.totalElements).toBe(0);
  });
});
