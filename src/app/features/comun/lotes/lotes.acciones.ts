import { Injectable, inject } from '@angular/core';
import { CuarentenasService } from '../../../core/api/generado/services/cuarentenas.service';
import { LotesService } from '../../../core/api/generado/services/lotes.service';
import { LoteResponseDto, MotivoBloqueo } from '../../../core/api/modelos';
import { aResultado } from '../../../core/api/resultado';
import { ROTULO_MOTIVO_MEDIDA } from '../../../shared/formato/etiquetas';
import { EjecutorAcciones } from '../../../shared/ui/ejecutor-acciones';

/** Motivos que un inspector puede elegir al abrir una cuarentena manual (R12). */
const MOTIVOS_MANUALES: readonly MotivoBloqueo[] = ['PREVENTIVA', 'DEFECTO_CALIDAD'];

/** Acciones sobre un lote: liberarlo y ponerlo en cuarentena. La API decide si corresponde (R4, R12). */
@Injectable({ providedIn: 'root' })
export class LotesAcciones {
  private readonly lotes = inject(LotesService);
  private readonly cuarentenas = inject(CuarentenasService);
  private readonly ejecutor = inject(EjecutorAcciones);

  /** Libera un lote (PENDIENTE_LIBERACION → LIBERADO). */
  liberar(lote: LoteResponseDto): Promise<boolean> {
    return this.ejecutor.conDialogo(
      {
        titulo: 'Liberar lote',
        detalle: lote.codigo,
        aviso: 'El lote queda disponible para armar bultos.',
        boton: 'Liberar',
        accion: () => aResultado(this.lotes.liberarLote({ id: lote.id })),
      },
      `Lote ${lote.codigo} liberado.`,
    );
  }

  /** Abre una cuarentena de lote, con motivo y descripción opcional. Solo inspectores. */
  ponerEnCuarentena(lote: LoteResponseDto, reporteId?: string): Promise<boolean> {
    return this.ejecutor.conDialogo(
      {
        titulo: 'Poner el lote en cuarentena',
        detalle: lote.codigo,
        aviso: 'Todas las cajas del lote quedan bloqueadas, estén donde estén.',
        selector: {
          etiqueta: 'Motivo',
          opciones: MOTIVOS_MANUALES.map((valor) => ({ valor, texto: ROTULO_MOTIVO_MEDIDA[valor] })),
        },
        campo: { etiqueta: 'Descripción', obligatorio: false },
        boton: 'Poner en cuarentena',
        accion: (descripcion, motivo) =>
          aResultado(
            this.cuarentenas.abrirCuarentena({
              body: {
                loteId: lote.id,
                motivo: motivo as MotivoBloqueo,
                ...(descripcion === '' ? {} : { descripcion }),
                ...(reporteId === undefined ? {} : { reporteId }),
              },
            }),
          ),
      },
      `Lote ${lote.codigo} en cuarentena.`,
    );
  }
}
