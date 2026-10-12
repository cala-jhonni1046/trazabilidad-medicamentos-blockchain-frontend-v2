import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { EmpresaResponseDto } from '../api/modelos';
import { PRESENTACION_ESTADO_HABILITACION } from '../../shared/estados/catalogo-estados';
import { Estado } from '../../shared/estados/estado';

/**
 * Aviso de que la empresa del usuario no está HABILITADA. Muestra el estado que devuelve el
 * backend; no bloquea nada: si una acción no corresponde, la API la rechaza y se muestra su error.
 * Con la empresa habilitada (o sin empresa) no muestra nada.
 */
@Component({
  selector: 'mc-aviso-empresa',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Estado],
  template: `
    @if (presentacion(); as estado) {
      <div class="aviso" role="status">
        <mc-estado [presentacion]="estado" />
        <p>
          <strong>{{ empresa()?.razonSocial }}</strong> figura como {{ estado.texto.toLowerCase() }} en ANMAT.
          Hasta que esté habilitada, el sistema puede rechazar algunas acciones.
        </p>
      </div>
    }
  `,
  styles: `
    .aviso {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 12px;
      align-items: center;
      padding: 10px 14px;
      background: var(--mc-superficie);
      border: 1px solid var(--mc-borde-fuerte);
      border-radius: var(--mc-radio-tarjeta);
    }
  `,
})
export class AvisoEmpresa {
  /** Empresa del usuario, o null. */
  readonly empresa = input<EmpresaResponseDto | null>(null);

  /** Presentación del estado, solo si la empresa existe y no está HABILITADA. */
  protected readonly presentacion = computed(() => {
    const empresa = this.empresa();
    return empresa === null || empresa.estado === 'HABILITADA'
      ? null
      : PRESENTACION_ESTADO_HABILITACION[empresa.estado];
  });
}
