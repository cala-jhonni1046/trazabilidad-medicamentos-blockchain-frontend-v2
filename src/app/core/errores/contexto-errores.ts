import { HttpContextToken } from '@angular/common/http';

/**
 * Marca de un pedido que maneja su propio 401 (el login: "credenciales inválidas" va en
 * el formulario). Sin esta marca, un 401 cierra la sesión y lleva a la pantalla de ingreso.
 *
 * Está en su propio archivo para que el servicio de sesión y el interceptor de errores
 * la usen sin importarse entre sí.
 */
export const MANEJA_401_PROPIO = new HttpContextToken<boolean>(() => false);
