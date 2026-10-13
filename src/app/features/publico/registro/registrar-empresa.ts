import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormField, email, form, required, submit, ValidationError } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { PROVINCIA, Provincia, RegistroResponseDto, TIPO_EMPRESA, TipoEmpresa } from '../../../core/api/modelos';
import { ErrorApi } from '../../../core/errores/error-api';
import { proveerOpcionesMaterial } from '../../../core/tema/opciones-material';
import { ROTULO_PROVINCIA, ROTULO_TIPO_EMPRESA } from '../../../shared/formato/etiquetas';
import { ErrorApiComponente } from '../../../shared/ui/error-api';
import { RegistroDatos } from './registro.datos';

/** Campos del formulario (el PDF va aparte: un archivo no es un valor de texto). */
interface DatosEmpresa {
  tipo: TipoEmpresa | '';
  cuit: string;
  razonSocial: string;
  gln: string;
  provincia: Provincia | '';
  localidad: string;
  domicilio: string;
  numeroHabilitacion: string;
  directorTecnico: string;
  adminNombre: string;
  adminApellido: string;
  adminDni: string;
  adminEmail: string;
  adminPassword: string;
  adminEsDirectorTecnico: boolean;
}

/** Campos que la API puede marcar con error (400). */
const CAMPOS: readonly (keyof DatosEmpresa)[] = [
  'tipo', 'cuit', 'razonSocial', 'gln', 'provincia', 'localidad', 'domicilio', 'numeroHabilitacion', 'directorTecnico',
  'adminNombre', 'adminApellido', 'adminDni', 'adminEmail', 'adminPassword', 'adminEsDirectorTecnico',
];

const VACIO: DatosEmpresa = {
  tipo: '', cuit: '', razonSocial: '', gln: '', provincia: '', localidad: '', domicilio: '', numeroHabilitacion: '',
  directorTecnico: '', adminNombre: '', adminApellido: '', adminDni: '', adminEmail: '', adminPassword: '', adminEsDirectorTecnico: false,
};

/**
 * Registro público de una empresa (laboratorio, distribuidora o farmacia) con el PDF de su habilitación y su
 * administrador inicial. No necesita sesión: la solicitud queda PENDIENTE y la revisa un inspector de la
 * provincia (o la asigna la Sede). Los formatos (CUIT, GLN, DNI, PDF real) los valida la API: sus errores
 * 400 van a cada campo y el resto se muestra tal cual. La contraseña no se guarda ni se muestra.
 */
@Component({
  selector: 'mc-registrar-empresa',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ErrorApiComponente, FormField, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatSelectModule, RouterLink],
  providers: [RegistroDatos, ...proveerOpcionesMaterial()],
  templateUrl: './registrar-empresa.html',
  styleUrl: './registro.scss',
})
export class RegistrarEmpresa {
  private readonly datos = inject(RegistroDatos);

  protected readonly tipos = TIPO_EMPRESA.map((valor) => ({ valor, texto: ROTULO_TIPO_EMPRESA[valor] }));
  protected readonly provincias = PROVINCIA.map((valor) => ({ valor, texto: ROTULO_PROVINCIA[valor] }));

  private readonly modelo = signal<DatosEmpresa>({ ...VACIO });

  protected readonly formulario = form(this.modelo, (c) => {
    required(c.tipo, { message: 'Elegí qué tipo de empresa es.' });
    required(c.cuit, { message: 'Escribí el CUIT.' });
    required(c.razonSocial, { message: 'Escribí la razón social.' });
    required(c.gln, { message: 'Escribí el GLN.' });
    required(c.provincia, { message: 'Elegí la provincia.' });
    required(c.localidad, { message: 'Escribí la localidad.' });
    required(c.domicilio, { message: 'Escribí el domicilio.' });
    required(c.adminNombre, { message: 'Escribí el nombre.' });
    required(c.adminApellido, { message: 'Escribí el apellido.' });
    required(c.adminDni, { message: 'Escribí el DNI.' });
    required(c.adminEmail, { message: 'Escribí el correo electrónico.' });
    email(c.adminEmail, { message: 'Escribí un correo con formato válido.' });
    required(c.adminPassword, { message: 'Escribí una contraseña.' });
  });

  /** El PDF elegido (null si todavía no hay). */
  protected readonly documento = signal<File | null>(null);
  protected readonly errorDocumento = signal<string | null>(null);

  protected readonly errorGeneral = signal<ErrorApi | null>(null);

  /** Lo que respondió la API al registrar (para mostrar su mensaje). */
  protected readonly registrada = signal<RegistroResponseDto | null>(null);

  protected readonly esLaboratorio = () => this.modelo().tipo === 'LABORATORIO';

  protected elegirArchivo(evento: Event): void {
    const entrada = evento.target as HTMLInputElement;
    this.documento.set(entrada.files?.item(0) ?? null);
    this.errorDocumento.set(null);
  }

  protected enviar(evento: Event): void {
    evento.preventDefault();
    this.errorGeneral.set(null);
    const archivo = this.documento();
    this.errorDocumento.set(archivo === null ? 'Elegí el PDF de la habilitación.' : null);
    void submit(this.formulario, async () => {
      if (archivo === null) {
        return undefined;
      }
      const m = this.modelo();
      const resultado = await this.datos.registrarEmpresa({
        tipo: m.tipo as TipoEmpresa,
        cuit: m.cuit.trim(),
        razonSocial: m.razonSocial.trim(),
        gln: m.gln.trim(),
        provincia: m.provincia as Provincia,
        localidad: m.localidad.trim(),
        domicilio: m.domicilio.trim(),
        ...(m.numeroHabilitacion.trim() === '' ? {} : { numeroHabilitacion: m.numeroHabilitacion.trim() }),
        ...(m.directorTecnico.trim() === '' ? {} : { directorTecnico: m.directorTecnico.trim() }),
        adminNombre: m.adminNombre.trim(),
        adminApellido: m.adminApellido.trim(),
        adminDni: m.adminDni.trim(),
        adminEmail: m.adminEmail.trim(),
        adminPassword: m.adminPassword,
        adminEsDirectorTecnico: m.tipo === 'LABORATORIO' && m.adminEsDirectorTecnico,
        documento: archivo,
      });
      if (resultado.ok) {
        // La contraseña no queda en memoria más tiempo del necesario.
        this.modelo.set({ ...VACIO });
        this.documento.set(null);
        this.registrada.set(resultado.valor);
        return undefined;
      }
      return this.repartir(resultado.error);
    });
  }

  /** Errores 400 por campo → a su campo; todo lo demás (409 EMPRESA_DUPLICADA, etc.), arriba del formulario. */
  private repartir(error: ErrorApi): ValidationError.WithFieldTree[] {
    const deCampo: ValidationError.WithFieldTree[] = [];
    for (const campo of error.campos) {
      const nombre = campo.field.split('.').pop() as keyof DatosEmpresa;
      if (CAMPOS.includes(nombre)) {
        deCampo.push({ kind: 'servidor', message: campo.message, fieldTree: this.formulario[nombre] });
      } else if (campo.field === 'documento') {
        this.errorDocumento.set(campo.message);
      }
    }
    if (deCampo.length === 0 && this.errorDocumento() === null) {
      this.errorGeneral.set(error);
    }
    return deCampo;
  }
}
