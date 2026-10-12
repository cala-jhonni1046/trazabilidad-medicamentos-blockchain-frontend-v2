import { HttpContext } from '@angular/common/http';
import { DOCUMENT, Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AutenticacionService } from '../api/generado/services/autenticacion.service';
import { LoginRequestDto } from '../api/modelos';
import { Resultado, aResultado } from '../api/resultado';
import { MANEJA_401_PROPIO } from '../errores/contexto-errores';
import { RUTA_INGRESAR } from './rutas-sesion';
import { borrarSesionGuardada, guardarSesion, leerSesionGuardada } from './sesion-almacen';
import { MotivoFinSesion, Sesion, sesionDesdeLogin, sesionVencida } from './sesion.model';

/** Máximo que acepta setTimeout (unos 24,8 días); más allá, se reprograma. */
const ESPERA_MAXIMA_TEMPORIZADOR_MS = 2_147_483_647;

/**
 * Sesión del usuario: ingreso, recuperación al recargar la página, vencimiento y salida.
 *
 * El JWT vive en una signal (la fuente de verdad) y se copia en sessionStorage solo para
 * sobrevivir a una recarga. La sesión termina sola al llegar a `expiraEn`.
 */
@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly documento = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly autenticacion = inject(AutenticacionService);
  private readonly sesionActual = signal<Sesion | null>(null);
  private temporizadorVencimiento: ReturnType<typeof setTimeout> | null = null;

  /** Sesión actual, o null si nadie ingresó. */
  readonly sesion: Signal<Sesion | null> = this.sesionActual.asReadonly();

  /** True si hay una sesión. */
  readonly autenticado: Signal<boolean> = computed(() => this.sesionActual() !== null);

  /**
   * Recupera la sesión guardada (por ejemplo, después de recargar la página).
   * Si está vencida o no es válida, la borra. Se llama una vez al arrancar (ver proveerSesion).
   */
  restaurar(): void {
    const almacen = this.almacen();
    const guardada = leerSesionGuardada(almacen);
    if (guardada === null || sesionVencida(guardada, Date.now())) {
      borrarSesionGuardada(almacen);
      return;
    }
    this.establecer(guardada);
  }

  /**
   * Ingresa con email y contraseña. Si la API acepta, guarda la sesión y programa su
   * vencimiento. Un 401 (credenciales inválidas) vuelve como error para el formulario:
   * no cierra nada ni redirige.
   */
  async iniciarSesion(credenciales: LoginRequestDto): Promise<Resultado<Sesion>> {
    const contexto = new HttpContext().set(MANEJA_401_PROPIO, true);
    const resultado = await aResultado(this.autenticacion.iniciarSesion({ body: credenciales }, contexto));
    if (!resultado.ok) {
      return resultado;
    }
    const sesion = sesionDesdeLogin(resultado.valor);
    guardarSesion(this.almacen(), sesion);
    this.establecer(sesion);
    return { ok: true, valor: sesion };
  }

  /** True si hay una sesión y ya pasó su expiraEn. */
  estaVencida(): boolean {
    const sesion = this.sesionActual();
    return sesion !== null && sesionVencida(sesion, Date.now());
  }

  /**
   * Termina la sesión: borra el estado y lo guardado, cancela el temporizador y lleva a la
   * pantalla de ingreso. Si venció o la API la rechazó, agrega `motivo` y `volver` (la ruta
   * actual) para explicarlo y volver ahí después de ingresar.
   */
  finalizarSesion(motivo: MotivoFinSesion): void {
    this.cancelarTemporizador();
    this.sesionActual.set(null);
    borrarSesionGuardada(this.almacen());

    const urlActual = this.router.url;
    // Varios pedidos pueden recibir 401 a la vez: si ya está en la pantalla de ingreso, no se navega de nuevo.
    if (urlActual.startsWith(RUTA_INGRESAR)) {
      return;
    }
    const parametros = motivo === 'salida' ? {} : { motivo, volver: urlActual };
    void this.router.navigate([RUTA_INGRESAR], { queryParams: parametros });
  }

  /** Activa una sesión válida y programa su vencimiento. */
  private establecer(sesion: Sesion): void {
    this.sesionActual.set(sesion);
    this.programarVencimiento();
  }

  /** Programa el fin de la sesión para la hora de expiraEn. */
  private programarVencimiento(): void {
    this.cancelarTemporizador();
    const sesion = this.sesionActual();
    if (sesion === null) {
      return;
    }
    const restanteMs = Date.parse(sesion.expiraEn) - Date.now();
    this.temporizadorVencimiento = setTimeout(
      () => {
        if (this.estaVencida()) {
          this.finalizarSesion('vencida');
        } else {
          // Faltaba más que la espera máxima de setTimeout: se vuelve a programar.
          this.programarVencimiento();
        }
      },
      Math.max(0, Math.min(restanteMs, ESPERA_MAXIMA_TEMPORIZADOR_MS)),
    );
  }

  /** Cancela el temporizador de vencimiento, si hay uno. */
  private cancelarTemporizador(): void {
    if (this.temporizadorVencimiento !== null) {
      clearTimeout(this.temporizadorVencimiento);
      this.temporizadorVencimiento = null;
    }
  }

  /** sessionStorage, o null si el navegador no lo permite. */
  private almacen(): Storage | null {
    try {
      return this.documento.defaultView?.sessionStorage ?? null;
    } catch {
      return null;
    }
  }
}
