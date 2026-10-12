import { Injectable } from '@angular/core';

/** Lo mínimo que se usa de un detector de códigos (el nativo del navegador o el de ZXing). */
export interface DetectorCodigos {
  detect(fuente: HTMLVideoElement): Promise<readonly { readonly rawValue: string }[]>;
}

/** El detector nativo del navegador (la API Barcode Detection no está en los tipos de TypeScript). */
interface DetectorNativo {
  new (opciones: { formats: string[] }): DetectorCodigos;
  getSupportedFormats(): Promise<string[]>;
}

/** Formatos que se buscan: el DataMatrix de las cajas y, por si acaso, QR. */
const FORMATOS = ['data_matrix', 'qr_code'] as const;

/** Ruta desde donde se sirve el binario de ZXing (angular.json lo copia de node_modules, sin CDN). */
export const RUTA_WASM_ZXING = '/zxing/zxing_reader.wasm';

/**
 * Acceso a la cámara y al detector de códigos. Está separado del componente para poder
 * reemplazarlo en los tests (jsdom no tiene cámara ni WebAssembly de ZXing).
 *
 * El detector es el del navegador si soporta DataMatrix; si no, el de `barcode-detector`
 * (ZXing en WebAssembly), que se carga recién cuando hace falta y con su `.wasm` servido
 * desde este mismo sitio (con una política de seguridad estricta hay que permitir
 * 'wasm-unsafe-eval').
 */
@Injectable({ providedIn: 'root' })
export class CamaraEscaner {
  /** True si el navegador permite pedir la cámara (requiere https o localhost). */
  disponible(): boolean {
    return typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia !== undefined;
  }

  /** Abre la cámara trasera si hay (la del celular), o la que haya. */
  abrirCamara(): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
  }

  /** Crea el detector: el nativo si lee DataMatrix; si no, ZXing. */
  async crearDetector(): Promise<DetectorCodigos> {
    const nativo = (globalThis as { BarcodeDetector?: DetectorNativo }).BarcodeDetector;
    if (nativo !== undefined) {
      const soportados = await nativo.getSupportedFormats();
      if (soportados.includes('data_matrix')) {
        return new nativo({ formats: [...FORMATOS] });
      }
    }
    const { BarcodeDetector: Detector, prepareZXingModule } = await import('barcode-detector/ponyfill');
    prepareZXingModule({
      overrides: { locateFile: (ruta: string, prefijo: string) => (ruta.endsWith('.wasm') ? RUTA_WASM_ZXING : prefijo + ruta) },
      fireImmediately: false,
    });
    return new Detector({ formats: [...FORMATOS] });
  }
}
