import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { Provider, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { proveerClienteApi } from '../app/core/api/api.providers';
import { RolUsuario } from '../app/core/api/modelos';
import { SesionService } from '../app/core/auth/sesion.service';
import { Sesion } from '../app/core/auth/sesion.model';
import { guardarSesionDePrueba, sesionDePrueba } from './sesion-de-prueba';

// Ayudas para probar pantallas completas contra un backend simulado (no se importan desde la app).

/** Una página del backend con los elementos y el total dados. */
export function pagina(content: object[], totalElements = content.length): object {
  return { content, page: { number: 0, size: 10, totalElements, totalPages: 1 } };
}

/** Un listado vacío. */
export const PAGINA_VACIA = pagina([]);

/** Un error del backend con su cuerpo estándar. */
export function errorApi(status: number, message: string, regla: string | null = null): [object, { status: number; statusText: string }] {
  return [{ status, message, regla, errors: null }, { status, statusText: 'Error' }];
}

/** Pantalla creada con una sesión del rol dado y un backend simulado. */
export interface Pantalla<T> {
  readonly fixture: ComponentFixture<T>;
  readonly raiz: HTMLElement;
  readonly http: HttpTestingController;
  /** Responde (y consume) el primer pedido GET a esa ruta. */
  responder(url: string, cuerpo: object): TestRequest;
  /** Espera a que se cumpla algo, dejando correr los recursos asíncronos. */
  esperar(comprobacion: () => void): Promise<void>;
}

/** Crea la pantalla con una sesión activa (rol, marcas) y proveedores extra. */
export function crearPantalla<T>(
  componente: Type<T>,
  rol: RolUsuario,
  opciones: { sesion?: Partial<Sesion>; proveedores?: Provider[]; entradas?: Record<string, unknown> } = {},
): Pantalla<T> {
  sessionStorage.clear();
  guardarSesionDePrueba(sesionDePrueba({ rol, ...opciones.sesion }));
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), proveerClienteApi(), ...(opciones.proveedores ?? [])],
  });
  TestBed.inject(SesionService).restaurar();
  const fixture = TestBed.createComponent(componente);
  for (const [nombre, valor] of Object.entries(opciones.entradas ?? {})) {
    fixture.componentRef.setInput(nombre, valor);
  }
  fixture.detectChanges();
  const http = TestBed.inject(HttpTestingController);
  return {
    fixture,
    raiz: fixture.nativeElement as HTMLElement,
    http,
    responder: (url, cuerpo) => {
      const pedido = http.match((p) => p.url === url)[0];
      pedido.flush(cuerpo);
      return pedido;
    },
    esperar: (comprobacion) =>
      vi.waitFor(() => {
        TestBed.tick();
        fixture.detectChanges();
        comprobacion();
      }),
  };
}

/** Texto visible de un botón o enlace (sin el texto oculto para lectores de pantalla). */
export function textoVisible(elemento: Element): string {
  const etiqueta = elemento.querySelector('.mdc-button__label') ?? elemento;
  const copia = etiqueta.cloneNode(true) as Element;
  copia.querySelectorAll('.mc-solo-lectores').forEach((n) => n.remove());
  return (copia.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** Texto visible de los botones y enlaces-botón de una fila. */
export function botones(fila: Element): string[] {
  return Array.from(fila.querySelectorAll('button, a[mat-stroked-button], a[mat-flat-button]')).map(textoVisible);
}

/** Envía el diálogo de acción abierto (escribiendo antes el texto, si se indica). */
export async function enviarDialogo(texto?: string): Promise<void> {
  const formulario = await vi.waitFor(() => {
    const f = document.querySelector('mc-dialogo-accion form') as HTMLFormElement | null;
    expect(f).not.toBeNull();
    if (texto !== undefined) {
      expect(f?.querySelector('textarea')).not.toBeNull();
    }
    return f as HTMLFormElement;
  });
  if (texto !== undefined) {
    const area = formulario.querySelector('textarea') as HTMLTextAreaElement;
    area.value = texto;
    area.dispatchEvent(new Event('input'));
  }
  formulario.dispatchEvent(new Event('submit', { cancelable: true }));
}

/** Cierra diálogos y avisos que hayan quedado abiertos en un test. */
export function limpiarOverlays(): void {
  document.querySelectorAll('.cdk-overlay-container').forEach((c) => (c.innerHTML = ''));
}

/** Busca un botón o enlace por su texto visible. */
export function boton(donde: ParentNode, texto: string): HTMLButtonElement {
  const encontrado = Array.from(donde.querySelectorAll('button, a[mat-stroked-button], a[mat-flat-button]')).find((b) => textoVisible(b) === texto);
  if (encontrado === undefined) {
    throw new Error(`No hay un botón "${texto}"`);
  }
  return encontrado as HTMLButtonElement;
}
