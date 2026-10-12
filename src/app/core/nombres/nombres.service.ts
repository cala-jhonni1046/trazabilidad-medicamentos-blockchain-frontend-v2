import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { EmpresasService } from '../api/generado/services/empresas.service';
import { UsuariosService } from '../api/generado/services/usuarios.service';
import { EmpresaResponseDto } from '../api/modelos';

/**
 * Caché de nombres: los DTO del backend traen ids (empresaId, usuarioId…) y las pantallas
 * muestran nombres. Cada id se pide una sola vez por sesión de la aplicación.
 *
 * Si la lectura falla (404 de una empresa que no se puede ver, sin conexión…) devuelve null
 * y NO guarda el fallo: la próxima vez se vuelve a intentar. Quien muestra el nombre decide
 * qué poner cuando es null.
 *
 * TODO B12: que los DTO traigan los nombres (ver docs/pedidos-b12.md, puntos 6 y 7).
 */
@Injectable({ providedIn: 'root' })
export class NombresService {
  private readonly empresas = inject(EmpresasService);
  private readonly usuarios = inject(UsuariosService);

  private readonly cacheEmpresas = new Map<string, Observable<EmpresaResponseDto | null>>();
  private readonly cacheUsuarios = new Map<string, Observable<string | null>>();

  /** La empresa con ese id, o null si no se pudo leer. */
  empresa(id: string): Observable<EmpresaResponseDto | null> {
    return this.conCache(this.cacheEmpresas, id, () => this.empresas.obtenerEmpresa({ id }));
  }

  /** "Nombre Apellido" del usuario con ese id, o null si no se pudo leer. */
  nombreUsuario(id: string): Observable<string | null> {
    return this.conCache(this.cacheUsuarios, id, () =>
      this.usuarios.obtenerUsuario({ id }).pipe(map((usuario) => `${usuario.nombre} ${usuario.apellido}`)),
    );
  }

  /** Olvida todo lo guardado (por ejemplo, al cerrar sesión). */
  vaciar(): void {
    this.cacheEmpresas.clear();
    this.cacheUsuarios.clear();
  }

  /** Devuelve el pedido guardado para el id, o lo crea; un fallo se convierte en null y se descarta. */
  private conCache<T>(
    cache: Map<string, Observable<T | null>>,
    id: string,
    pedir: () => Observable<T>,
  ): Observable<T | null> {
    const guardado = cache.get(id);
    if (guardado !== undefined) {
      return guardado;
    }
    const nuevo = pedir().pipe(
      catchError(() => {
        cache.delete(id);
        return of(null);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    cache.set(id, nuevo);
    return nuevo;
  }
}
