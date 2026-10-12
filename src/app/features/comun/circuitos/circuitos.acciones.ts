import { Injectable, inject } from '@angular/core';
import { CircuitosService } from '../../../core/api/generado/services/circuitos.service';
import { EnlaceCuitResponseDto } from '../../../core/api/modelos';
import { aResultado } from '../../../core/api/resultado';
import { EjecutorAcciones } from '../../../shared/ui/ejecutor-acciones';

/**
 * Acciones sobre un circuito (laboratorio → distribuidora → farmacia): las del inspector
 * (tomar, aprobar, rechazar, suspender, rehabilitar) y las de las empresas (aceptar, rechazar).
 * Cada método devuelve true si la API aceptó; si no, muestra su error tal cual (R5).
 */
@Injectable({ providedIn: 'root' })
export class CircuitosAcciones {
  private readonly api = inject(CircuitosService);
  private readonly ejecutor = inject(EjecutorAcciones);

  tomar(circuito: EnlaceCuitResponseDto): Promise<boolean> {
    return this.ejecutor.directa(() => aResultado(this.api.tomarCircuito({ id: circuito.id })), `Tomaste el circuito ${circuito.codigo}.`);
  }

  aprobar(circuito: EnlaceCuitResponseDto): Promise<boolean> {
    return this.ejecutor.conDialogo(
      {
        titulo: 'Aprobar circuito',
        detalle: circuito.codigo,
        aviso: 'Se vuelve a verificar que las tres empresas estén habilitadas.',
        boton: 'Aprobar',
        accion: () => aResultado(this.api.aprobarCircuito({ id: circuito.id })),
      },
      `Circuito ${circuito.codigo} aprobado.`,
    );
  }

  rechazar(circuito: EnlaceCuitResponseDto): Promise<boolean> {
    return this.ejecutor.conDialogo(
      {
        titulo: 'Rechazar circuito',
        detalle: circuito.codigo,
        aviso: 'El rechazo es definitivo: el laboratorio tendrá que proponerlo de nuevo.',
        campo: { etiqueta: 'Motivo del rechazo' },
        boton: 'Rechazar',
        accion: (motivo) => aResultado(this.api.rechazarCircuito({ id: circuito.id, body: { motivo } })),
      },
      `Circuito ${circuito.codigo} rechazado.`,
    );
  }

  suspender(circuito: EnlaceCuitResponseDto): Promise<boolean> {
    return this.ejecutor.conDialogo(
      {
        titulo: 'Suspender circuito',
        detalle: circuito.codigo,
        campo: { etiqueta: 'Motivo de la suspensión' },
        boton: 'Suspender',
        accion: (motivo) => aResultado(this.api.suspenderCircuito({ id: circuito.id, body: { motivo } })),
      },
      `Circuito ${circuito.codigo} suspendido.`,
    );
  }

  rehabilitar(circuito: EnlaceCuitResponseDto): Promise<boolean> {
    return this.ejecutor.conDialogo(
      {
        titulo: 'Rehabilitar circuito',
        detalle: circuito.codigo,
        boton: 'Rehabilitar',
        accion: () => aResultado(this.api.rehabilitarCircuito({ id: circuito.id })),
      },
      `Circuito ${circuito.codigo} aprobado otra vez.`,
    );
  }

  /** La distribuidora o la farmacia (administrador) aceptan su parte. */
  aceptar(circuito: EnlaceCuitResponseDto): Promise<boolean> {
    return this.ejecutor.conDialogo(
      {
        titulo: 'Aceptar circuito',
        detalle: circuito.codigo,
        boton: 'Aceptar',
        accion: () => aResultado(this.api.aceptarCircuito({ id: circuito.id })),
      },
      `Aceptaste el circuito ${circuito.codigo}.`,
    );
  }

  /** La distribuidora o la farmacia (administrador) rechazan el circuito, con motivo. */
  rechazarPorEmpresa(circuito: EnlaceCuitResponseDto): Promise<boolean> {
    return this.ejecutor.conDialogo(
      {
        titulo: 'Rechazar circuito',
        detalle: circuito.codigo,
        campo: { etiqueta: 'Motivo del rechazo' },
        boton: 'Rechazar',
        accion: (motivo) => aResultado(this.api.rechazarCircuitoPorEmpresa({ id: circuito.id, body: { motivo } })),
      },
      `Rechazaste el circuito ${circuito.codigo}.`,
    );
  }
}
