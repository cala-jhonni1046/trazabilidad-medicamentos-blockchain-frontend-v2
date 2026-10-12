import { Injectable, inject } from '@angular/core';
import { EmpresasService } from '../../../core/api/generado/services/empresas.service';
import { EmpresaResponseDto } from '../../../core/api/modelos';
import { Resultado, aResultado } from '../../../core/api/resultado';
import { AvisosService } from '../../../core/errores/avisos.service';
import { EjecutorAcciones } from '../../../shared/ui/ejecutor-acciones';

/**
 * Acciones sobre una empresa (habilitación y suspensión), con sus diálogos de confirmación o de
 * motivo. Cada método devuelve true si la API aceptó. La API decide si corresponde (R2): sus
 * errores 404 y 409 se muestran tal cual.
 */
@Injectable({ providedIn: 'root' })
export class EmpresasAcciones {
  private readonly empresas = inject(EmpresasService);
  private readonly ejecutor = inject(EjecutorAcciones);
  private readonly avisos = inject(AvisosService);

  /** El inspector toma la solicitud (queda como revisor). */
  tomar(empresa: EmpresaResponseDto): Promise<boolean> {
    return this.ejecutor.directa(() => aResultado(this.empresas.tomarEmpresa({ id: empresa.id })), `Tomaste la solicitud de ${empresa.razonSocial}.`);
  }

  /** Habilita la empresa (PENDIENTE → HABILITADA). */
  habilitar(empresa: EmpresaResponseDto): Promise<boolean> {
    return this.ejecutor.conDialogo(
      {
        titulo: 'Habilitar empresa',
        detalle: empresa.razonSocial,
        aviso: 'Revisá el PDF de habilitación antes de confirmar.',
        boton: 'Habilitar',
        accion: () => aResultado(this.empresas.habilitarEmpresa({ id: empresa.id })),
      },
      `${empresa.razonSocial} quedó habilitada.`,
    );
  }

  /** Rechaza la solicitud, con motivo. */
  rechazar(empresa: EmpresaResponseDto): Promise<boolean> {
    return this.ejecutor.conDialogo(
      {
        titulo: 'Rechazar solicitud',
        detalle: empresa.razonSocial,
        campo: { etiqueta: 'Motivo del rechazo' },
        boton: 'Rechazar',
        accion: (motivo) => aResultado(this.empresas.rechazarEmpresa({ id: empresa.id, body: { motivo } })),
      },
      'Solicitud rechazada.',
    );
  }

  /** Suspende la empresa (y sus circuitos aprobados), con motivo. Solo la Sede. */
  suspender(empresa: EmpresaResponseDto): Promise<boolean> {
    return this.ejecutor.conDialogo(
      {
        titulo: 'Suspender empresa',
        detalle: empresa.razonSocial,
        aviso: 'Sus circuitos aprobados también quedan suspendidos.',
        campo: { etiqueta: 'Motivo de la suspensión' },
        boton: 'Suspender',
        accion: (motivo) => aResultado(this.empresas.suspenderEmpresa({ id: empresa.id, body: { motivo } })),
      },
      `${empresa.razonSocial} quedó suspendida.`,
    );
  }

  /** Rehabilita una empresa suspendida. Solo la Sede. */
  rehabilitar(empresa: EmpresaResponseDto): Promise<boolean> {
    return this.ejecutor.conDialogo(
      {
        titulo: 'Rehabilitar empresa',
        detalle: empresa.razonSocial,
        boton: 'Rehabilitar',
        accion: () => aResultado(this.empresas.rehabilitarEmpresa({ id: empresa.id })),
      },
      `${empresa.razonSocial} quedó habilitada otra vez.`,
    );
  }

  /** Descarga el PDF de habilitación (se guarda como archivo). */
  async descargarDocumento(empresa: EmpresaResponseDto): Promise<void> {
    const resultado: Resultado<unknown> = await aResultado(this.empresas.descargarDocumentoEmpresa({ id: empresa.id }));
    if (!resultado.ok) {
      this.avisos.mostrarError(resultado.error.mensaje);
      return;
    }
    // TODO B12: el contrato declara el PDF como `string` (format: byte); en realidad llega un Blob
    // (docs/pedidos-b12.md, punto 4).
    const archivo = resultado.valor as Blob;
    const direccion = URL.createObjectURL(new Blob([archivo], { type: 'application/pdf' }));
    const enlace = document.createElement('a');
    enlace.href = direccion;
    enlace.download = empresa.documentoNombre ?? `habilitacion-${empresa.cuit}.pdf`;
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(direccion), 10_000);
  }
}
