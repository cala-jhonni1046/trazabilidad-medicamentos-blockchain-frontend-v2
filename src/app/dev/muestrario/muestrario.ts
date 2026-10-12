import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SelectorTema } from '../../core/tema/selector-tema';
import { TemaService } from '../../core/tema/tema.service';

/** Un token de color: nombre sin el prefijo --mc- y para qué se usa. */
interface MuestraColor {
  readonly token: string;
  readonly uso: string;
}

/** Un tono de estado: clave del token (--mc-<clave> y --mc-<clave>-suave) y nombre visible. */
interface MuestraTono {
  readonly clave: string;
  readonly nombre: string;
}

/**
 * Muestrario de diseño (solo en desarrollo, ruta /dev): tokens, tipografía y
 * componentes de Material, para revisarlos en modo claro y oscuro.
 */
@Component({
  selector: 'mc-muestrario',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    SelectorTema,
  ],
  templateUrl: './muestrario.html',
  styleUrl: './muestrario.scss',
})
export class Muestrario {
  protected readonly tema = inject(TemaService);
  private readonly avisos = inject(MatSnackBar);

  protected readonly colores: readonly MuestraColor[] = [
    { token: 'fondo', uso: 'Fondo de la página' },
    { token: 'superficie', uso: 'Tarjetas y paneles' },
    { token: 'superficie-2', uso: 'Encabezados de tabla, zonas secundarias' },
    { token: 'lateral', uso: 'Barra lateral' },
    { token: 'borde', uso: 'Bordes decorativos' },
    { token: 'borde-fuerte', uso: 'Contorno de campos (3:1)' },
    { token: 'texto', uso: 'Texto principal' },
    { token: 'texto-secundario', uso: 'Texto secundario' },
    { token: 'primario', uso: 'Solo acciones' },
    { token: 'primario-suave', uso: 'Fondo de una acción seleccionada' },
    { token: 'sobre-primario', uso: 'Texto sobre un botón relleno' },
    { token: 'primario-inverso', uso: 'Acción sobre un aviso invertido' },
  ];

  protected readonly tonos: readonly MuestraTono[] = [
    { clave: 'correcto', nombre: 'Correcto' },
    { clave: 'atencion', nombre: 'Atención' },
    { clave: 'critico', nombre: 'Crítico' },
    { clave: 'transito', nombre: 'En tránsito' },
    { clave: 'blockchain', nombre: 'Blockchain' },
    { clave: 'neutro', nombre: 'Neutro' },
  ];

  /** Hash de ejemplo (64 hex), para ver JetBrains Mono. */
  protected readonly hashEjemplo = '3f9a1c0e7b2d4e6f8a1b3c5d7e9f0a2b4c6d8e0f1a3b5c7d9e1f2a4b6c8d0e2f';

  /** Muestra un aviso de prueba (superficie invertida con acción). */
  protected mostrarAviso(): void {
    this.avisos.open('Aviso de prueba: así se ve un snackbar.', 'Deshacer', { duration: 4000 });
  }
}
