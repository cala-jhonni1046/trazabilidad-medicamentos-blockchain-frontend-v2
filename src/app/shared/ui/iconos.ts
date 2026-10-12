// Íconos de la aplicación: Material Symbols (outlined, peso 400), registrados de a uno.
// Solo están los que se usan: para agregar uno, importar su SVG y sumarlo a ICONOS.
// (Los SVG se importan como texto: loader ".svg" en angular.json.)
import block from '@material-symbols/svg-400/outlined/block.svg';
import cancel from '@material-symbols/svg-400/outlined/cancel.svg';
import checkCircle from '@material-symbols/svg-400/outlined/check_circle.svg';
import contentPaste from '@material-symbols/svg-400/outlined/content_paste.svg';
import darkMode from '@material-symbols/svg-400/outlined/dark_mode.svg';
import dashboard from '@material-symbols/svg-400/outlined/dashboard.svg';
import error from '@material-symbols/svg-400/outlined/error.svg';
import help from '@material-symbols/svg-400/outlined/help.svg';
import home from '@material-symbols/svg-400/outlined/home.svg';
import lightMode from '@material-symbols/svg-400/outlined/light_mode.svg';
import link from '@material-symbols/svg-400/outlined/link.svg';
import localShipping from '@material-symbols/svg-400/outlined/local_shipping.svg';
import logout from '@material-symbols/svg-400/outlined/logout.svg';
import openInNew from '@material-symbols/svg-400/outlined/open_in_new.svg';
import pauseCircle from '@material-symbols/svg-400/outlined/pause_circle.svg';
import person from '@material-symbols/svg-400/outlined/person.svg';
import personCheck from '@material-symbols/svg-400/outlined/person_check.svg';
import report from '@material-symbols/svg-400/outlined/report.svg';
import schedule from '@material-symbols/svg-400/outlined/schedule.svg';
import search from '@material-symbols/svg-400/outlined/search.svg';
import verified from '@material-symbols/svg-400/outlined/verified.svg';
import warning from '@material-symbols/svg-400/outlined/warning.svg';

/** Nombres de los íconos disponibles (los de Material Symbols, en snake_case). */
export type NombreIcono =
  | 'block'
  | 'cancel'
  | 'check_circle'
  | 'content_paste'
  | 'dark_mode'
  | 'dashboard'
  | 'error'
  | 'help'
  | 'home'
  | 'light_mode'
  | 'link'
  | 'local_shipping'
  | 'logout'
  | 'open_in_new'
  | 'pause_circle'
  | 'person'
  | 'person_check'
  | 'report'
  | 'schedule'
  | 'search'
  | 'verified'
  | 'warning';

/** Contenido SVG de cada ícono. Es un Record: no se puede declarar un nombre sin su SVG. */
export const ICONOS: Record<NombreIcono, string> = {
  block,
  cancel,
  check_circle: checkCircle,
  content_paste: contentPaste,
  dark_mode: darkMode,
  dashboard,
  error,
  help,
  home,
  light_mode: lightMode,
  link,
  local_shipping: localShipping,
  logout,
  open_in_new: openInNew,
  pause_circle: pauseCircle,
  person,
  person_check: personCheck,
  report,
  schedule,
  search,
  verified,
  warning,
};
