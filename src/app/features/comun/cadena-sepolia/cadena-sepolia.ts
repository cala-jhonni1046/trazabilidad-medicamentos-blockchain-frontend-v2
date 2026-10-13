import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { RegistroBlockchainResponseDto } from '../../../core/api/modelos';
import { SesionService } from '../../../core/auth/sesion.service';
import { AvisosService } from '../../../core/errores/avisos.service';
import { ErrorApi } from '../../../core/errores/error-api';
import { proveerPaginadorEs } from '../../../core/tema/paginador-es';
import {
  PRESENTACION_ESTADO_ANCLAJE,
  PRESENTACION_ESTADO_VERIFICACION_BLOCKCHAIN,
} from '../../../shared/estados/catalogo-estados';
import { Estado } from '../../../shared/estados/estado';
import { ROTULO_TIPO_EVENTO } from '../../../shared/formato/etiquetas';
import { FechaHoraPipe } from '../../../shared/formato/pipes-fechas';
import { abrirDialogoAccion } from '../../../shared/ui/dialogo-accion';
import { ErrorApiComponente } from '../../../shared/ui/error-api';
import { Hash } from '../../../shared/ui/hash';
import { Icono } from '../../../shared/ui/icono';
import { Tarjeta } from '../../../shared/ui/tarjeta';
import { CadenaDatos } from './cadena.datos';

/**
 * "Cadena y Sepolia": estado del anclaje en la blockchain, verificación de la cadena de
 * eventos, "Anclar ya" (solo Sede) e historiales. La comparten la Sede y los inspectores.
 * Los permisos los decide la API; acá solo se oculta "Anclar ya" a quien no es de la Sede.
 */
@Component({
  selector: 'mc-cadena-sepolia',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ErrorApiComponente, Estado, FechaHoraPipe, Hash, Icono, MatButtonModule, MatPaginatorModule, Tarjeta],
  providers: [CadenaDatos, ...proveerPaginadorEs()],
  templateUrl: './cadena-sepolia.html',
  styleUrl: './cadena-sepolia.scss',
})
export class CadenaSepolia {
  protected readonly datos = inject(CadenaDatos);
  private readonly dialogo = inject(MatDialog);
  private readonly avisos = inject(AvisosService);
  private readonly sesion = inject(SesionService);

  protected readonly rotuloEvento = ROTULO_TIPO_EVENTO;
  protected readonly presentarAnclaje = PRESENTACION_ESTADO_ANCLAJE;
  protected readonly presentarBlockchain = PRESENTACION_ESTADO_VERIFICACION_BLOCKCHAIN;

  /** Solo la Sede ve "Anclar ya" (la API rechaza a cualquier otro rol). */
  protected readonly puedeAnclar = computed(() => this.sesion.sesion()?.rol === 'SEDE_CENTRAL');

  /** Error de "Anclar ya" (409 o 503), mostrado junto al botón. */
  protected readonly errorAnclaje = signal<ErrorApi | null>(null);

  /** Enlace a Etherscan solo si es https (viene de la API). */
  protected enlaceSeguro(enlace: string | null | undefined): string | null {
    return enlace != null && enlace.startsWith('https://') ? enlace : null;
  }

  protected cambiarPaginaAnclajes(evento: PageEvent): void {
    this.datos.historialAnclajes.irA(evento.pageIndex, evento.pageSize);
  }

  protected cambiarPaginaEventos(evento: PageEvent): void {
    this.datos.historialEventos.irA(evento.pageIndex, evento.pageSize);
  }

  /** Pide confirmación (muestra el costo estimado) y ancla. La API decide si corresponde. */
  protected async anclarAhora(): Promise<void> {
    this.errorAnclaje.set(null);
    const estado = this.datos.estado.hasValue() ? this.datos.estado.value() : null;
    const costo = estado?.costoPorAnclajeEth != null ? `Costo estimado: ${estado.costoPorAnclajeEth} ETH de prueba. ` : '';
    let rechazo: ErrorApi | null = null;
    const hecho = await abrirDialogoAccion(this.dialogo, {
      titulo: 'Anclar ahora en Sepolia',
      aviso: `${costo}Se envía el hash del último evento a la blockchain. Tarda unos 40 segundos en confirmarse.`,
      boton: 'Anclar ahora',
      accion: async () => {
        const resultado = await this.datos.anclarAhora();
        if (!resultado.ok) {
          rechazo = resultado.error;
        }
        return resultado;
      },
    });
    if (hecho) {
      this.avisos.mostrarExito('Anclaje enviado. Seguimos su confirmación.');
    } else if (rechazo !== null) {
      // El diálogo ya mostró el error; se deja también junto al botón para que no se pierda al cerrarlo.
      this.errorAnclaje.set(rechazo);
    }
  }

  /** Texto "desde–hasta" de los eventos que cubre un anclaje. */
  protected rango(anclaje: RegistroBlockchainResponseDto): string {
    return anclaje.desdeNumero === anclaje.hastaNumero ? `#${anclaje.desdeNumero}` : `#${anclaje.desdeNumero} a #${anclaje.hastaNumero}`;
  }
}
