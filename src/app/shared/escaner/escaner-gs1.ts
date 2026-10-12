import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, inject, output, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { CodigoLeido } from '../ui/campo-codigo';
import { Icono } from '../ui/icono';
import { CamaraEscaner, DetectorCodigos } from './camara';
import { leerCodigoPegado } from './parser-gs1';

/** Cada cuánto se intenta leer un cuadro del video, en milisegundos. */
export const INTERVALO_LECTURA_MS = 250;

type Fase = 'iniciando' | 'escaneando' | 'error';

/**
 * Escáner de cámara: muestra el video y busca el DataMatrix GS1 de la caja. Al reconocer GTIN
 * y serie emite `leido` y apaga la cámara. Si el permiso se niega o no hay cámara, lo explica
 * y la persona puede escribir los datos a mano. La cámara se apaga siempre al cerrar o salir.
 * Se carga bajo demanda (`@defer`) para no pesar en el bundle inicial.
 */
@Component({
  selector: 'mc-escaner-gs1',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icono, MatButtonModule],
  template: `
    <div class="escaner" role="group" aria-label="Escáner de cámara">
      @if (fase() !== 'error') {
        <video #video class="video" muted playsinline aria-label="Vista de la cámara"></video>
      }
      @switch (fase()) {
        @case ('iniciando') {
          <p role="status">Abriendo la cámara…</p>
        }
        @case ('escaneando') {
          <p role="status">Apuntá la cámara al código de la caja (el cuadradito de puntos).</p>
        }
        @case ('error') {
          <p class="error" role="alert">{{ mensajeError() }}</p>
        }
      }
      @if (pista(); as texto) {
        <p class="pista" role="status">{{ texto }}</p>
      }
      <button mat-stroked-button type="button" (click)="cerrar()"><mc-icono nombre="cancel" />Cerrar la cámara</button>
    </div>
  `,
  styles: `
    .escaner {
      display: grid;
      gap: 8px;
      justify-items: start;
    }
    .video {
      width: 100%;
      max-width: 420px;
      aspect-ratio: 4 / 3;
      background: var(--mc-lateral);
      border-radius: var(--mc-radio-control);
      object-fit: cover;
    }
    p {
      margin: 0;
    }
    .error {
      color: var(--mc-critico);
      font-weight: 600;
    }
    .pista {
      color: var(--mc-atencion);
    }
  `,
})
export class EscanerGs1 implements OnInit, OnDestroy {
  private readonly camara = inject(CamaraEscaner);
  private readonly video = viewChild<ElementRef<HTMLVideoElement>>('video');

  /** Se emite con el GTIN y la serie del código reconocido. */
  readonly leido = output<CodigoLeido>();
  /** Se emite cuando la persona cierra el escáner (o termina de leer). */
  readonly cerrado = output<void>();

  protected readonly fase = signal<Fase>('iniciando');
  protected readonly mensajeError = signal('');
  protected readonly pista = signal<string | null>(null);

  private flujo: MediaStream | null = null;
  private temporizador: ReturnType<typeof setTimeout> | null = null;
  private activo = true;

  async ngOnInit(): Promise<void> {
    if (!this.camara.disponible()) {
      this.fallar('Este navegador no permite usar la cámara (hace falta una conexión segura). Escribí el GTIN y la serie a mano.');
      return;
    }
    try {
      const [flujo, detector] = await Promise.all([this.camara.abrirCamara(), this.camara.crearDetector()]);
      if (!this.activo) {
        // Se cerró mientras se abría: se apaga lo que recién se abrió.
        flujo.getTracks().forEach((pista) => pista.stop());
        return;
      }
      this.flujo = flujo;
      this.fase.set('escaneando');
      await this.mostrar(flujo);
      this.buscar(detector);
    } catch (error: unknown) {
      this.fallar(mensajeDeCamara(error));
    }
  }

  ngOnDestroy(): void {
    this.apagar();
  }

  protected cerrar(): void {
    this.apagar();
    this.cerrado.emit();
  }

  /** Conecta el flujo al elemento de video (que aparece cuando la fase deja de ser "iniciando"). */
  private async mostrar(flujo: MediaStream): Promise<void> {
    await new Promise<void>((resolver) => setTimeout(resolver));
    const elemento = this.video()?.nativeElement;
    if (elemento !== undefined) {
      elemento.srcObject = flujo;
      await elemento.play().catch(() => undefined);
    }
  }

  /** Intenta leer un cuadro cada {@link INTERVALO_LECTURA_MS} hasta reconocer una caja. */
  private buscar(detector: DetectorCodigos): void {
    const intentar = async (): Promise<void> => {
      const elemento = this.video()?.nativeElement;
      if (!this.activo || elemento === undefined) {
        return;
      }
      try {
        const encontrados = await detector.detect(elemento);
        for (const encontrado of encontrados) {
          const codigo = leerCodigoPegado(encontrado.rawValue);
          if (codigo !== null) {
            this.leido.emit(codigo);
            this.cerrar();
            return;
          }
          this.pista.set('Detectamos un código, pero no es el de una caja de medicamento. Probá con el DataMatrix de la caja.');
        }
      } catch {
        // Un cuadro que no se pudo leer no frena el escaneo: se vuelve a intentar.
      }
      if (this.activo) {
        this.temporizador = setTimeout(() => void intentar(), INTERVALO_LECTURA_MS);
      }
    };
    void intentar();
  }

  private fallar(mensaje: string): void {
    this.mensajeError.set(mensaje);
    this.fase.set('error');
  }

  /** Apaga la cámara y frena la búsqueda. */
  private apagar(): void {
    this.activo = false;
    if (this.temporizador !== null) {
      clearTimeout(this.temporizador);
      this.temporizador = null;
    }
    this.flujo?.getTracks().forEach((pista) => pista.stop());
    this.flujo = null;
  }
}

/** Texto para cada motivo por el que no se pudo abrir la cámara. */
function mensajeDeCamara(error: unknown): string {
  const nombre = error instanceof DOMException ? error.name : '';
  if (nombre === 'NotAllowedError' || nombre === 'SecurityError') {
    return 'No pudimos usar la cámara: el permiso está denegado. Habilitalo en el navegador o escribí el GTIN y la serie a mano.';
  }
  if (nombre === 'NotFoundError' || nombre === 'OverconstrainedError') {
    return 'No encontramos una cámara en este dispositivo. Escribí el GTIN y la serie a mano.';
  }
  return 'No pudimos abrir la cámara. Escribí el GTIN y la serie a mano.';
}
