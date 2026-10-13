import { Injectable, inject } from '@angular/core';
import { RegistroPublicoService } from '../../../core/api/generado/services/registro-publico.service';
import { RegistroEmpresaRequestDto, RegistroPacienteRequestDto, RegistroResponseDto } from '../../../core/api/modelos';
import { Resultado, aResultado } from '../../../core/api/resultado';

/** Acceso al registro público (sin token): una empresa nueva (con su PDF) o un paciente. */
@Injectable()
export class RegistroDatos {
  private readonly api = inject(RegistroPublicoService);

  /** Registra una empresa con su administrador inicial y el PDF de habilitación (queda PENDIENTE de revisión). */
  registrarEmpresa(datos: RegistroEmpresaRequestDto): Promise<Resultado<RegistroResponseDto>> {
    return aResultado(this.api.registrarEmpresa({ body: datos }));
  }

  /** Registra la cuenta de un paciente. */
  registrarPaciente(datos: RegistroPacienteRequestDto): Promise<Resultado<RegistroResponseDto>> {
    return aResultado(this.api.registrarPaciente({ body: datos }));
  }
}
