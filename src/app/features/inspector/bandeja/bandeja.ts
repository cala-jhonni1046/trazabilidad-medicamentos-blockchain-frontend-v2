import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ListaCircuitos } from '../../comun/circuitos/lista-circuitos';
import { ListaEmpresas } from '../../comun/empresas/lista-empresas';
import { ListaLotes } from '../../comun/lotes/lista-lotes';
import { ListaMedidas } from '../../comun/medidas/lista-medidas';
import { ListaReportes } from '../../comun/reportes/lista-reportes';

/**
 * Bandeja del inspector ("Pendientes de tu acción"): lo que su provincia espera de él, en cinco
 * listados. Cada uno trae solo lo que corresponde al inspector (lo decide la API).
 */
@Component({
  selector: 'mc-bandeja',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ListaCircuitos, ListaEmpresas, ListaLotes, ListaMedidas, ListaReportes],
  template: `
    <h1>Pendientes de tu acción</h1>
    <mc-lista-empresas titulo="Empresas por habilitar" modo="bandeja" />
    <mc-lista-circuitos titulo="Circuitos por aprobar" modo="bandeja" />
    <mc-lista-lotes titulo="Biológicos por liberar" modo="bandeja-liberacion" />
    <mc-lista-medidas titulo="Cuarentenas por revisar" modo="bandeja" />
    <mc-lista-reportes titulo="Reportes ciudadanos" modo="bandeja" />
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
    }
  `,
})
export class Bandeja {}
