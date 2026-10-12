// Íconos de la aplicación: Material Symbols (outlined, peso 400), registrados de a uno.
// Solo están los que se usan: para agregar uno, importar su SVG y sumarlo a ICONOS.
// (Los SVG se importan como texto: loader ".svg" en angular.json.)
import cancel from '@material-symbols/svg-400/outlined/cancel.svg';
import checkCircle from '@material-symbols/svg-400/outlined/check_circle.svg';
import darkMode from '@material-symbols/svg-400/outlined/dark_mode.svg';
import home from '@material-symbols/svg-400/outlined/home.svg';
import lightMode from '@material-symbols/svg-400/outlined/light_mode.svg';
import logout from '@material-symbols/svg-400/outlined/logout.svg';
import pauseCircle from '@material-symbols/svg-400/outlined/pause_circle.svg';
import schedule from '@material-symbols/svg-400/outlined/schedule.svg';
import warning from '@material-symbols/svg-400/outlined/warning.svg';

/** Nombres de los íconos disponibles (los de Material Symbols, en snake_case). */
export type NombreIcono =
  | 'cancel'
  | 'check_circle'
  | 'dark_mode'
  | 'home'
  | 'light_mode'
  | 'logout'
  | 'pause_circle'
  | 'schedule'
  | 'warning';

/** Contenido SVG de cada ícono. Es un Record: no se puede declarar un nombre sin su SVG. */
export const ICONOS: Record<NombreIcono, string> = {
  cancel,
  check_circle: checkCircle,
  dark_mode: darkMode,
  home,
  light_mode: lightMode,
  logout,
  pause_circle: pauseCircle,
  schedule,
  warning,
};
