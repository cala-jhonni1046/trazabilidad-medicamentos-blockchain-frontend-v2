import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { TableroService } from '../api/generado/services/tablero.service';
import { BandejaInspectorResponseDto } from '../api/modelos';
import { SesionService } from '../auth/sesion.service';

/** Los contadores que devuelve la API para las bandejas de un inspector. */
export type ClavePendientes = keyof BandejaInspectorResponseDto;

/**
 * Cuántos pendientes tiene el inspector en cada bandeja, para las insignias del menú
 * (`GET /api/tablero/bandeja-inspector`: un solo pedido; cada total es el de su lista).
 *
 * Solo pide si hay una sesión de INSPECTOR. Se vuelve a pedir en cada cambio de pantalla, así lo que
 * el inspector toma, aprueba o cierra se refleja al volver al menú. Si el pedido falla no se muestra
 * ninguna insignia (el menú sigue funcionando); los errores globales los resuelve el interceptor.
 */
@Injectable()
export class PendientesInspector {
  private readonly api = inject(TableroService);
  private readonly sesion = inject(SesionService);

  /** Se incrementa en cada navegación terminada para volver a pedir los contadores. */
  private readonly version = signal(0);

  private readonly recurso = rxResource<BandejaInspectorResponseDto, number | undefined>({
    params: () => (this.sesion.sesion()?.rol === 'INSPECTOR' ? this.version() : undefined),
    stream: () => this.api.obtenerBandejaInspector(),
  });

  /** Contadores actuales, o null si no es inspector, todavía no cargaron o fallaron. */
  readonly contadores: Signal<BandejaInspectorResponseDto | null> = computed(() =>
    this.recurso.hasValue() ? this.recurso.value() : null,
  );

  constructor() {
    inject(Router)
      .events.pipe(
        filter((evento) => evento instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.version.update((n) => n + 1));
  }

  /** Suma de los contadores indicados (null si todavía no hay datos). */
  total(claves: readonly ClavePendientes[]): number | null {
    const datos = this.contadores();
    return datos === null ? null : claves.reduce((suma, clave) => suma + datos[clave], 0);
  }
}
