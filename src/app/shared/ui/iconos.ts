// Íconos de la aplicación: Material Symbols (outlined, peso 400), registrados de a uno.
// Solo están los que se usan: para agregar uno, importar su SVG y sumarlo a ICONOS.
// (Los SVG se importan como texto: loader ".svg" en angular.json.)
import add from '@material-symbols/svg-400/outlined/add.svg';
import block from '@material-symbols/svg-400/outlined/block.svg';
import cancel from '@material-symbols/svg-400/outlined/cancel.svg';
import checkCircle from '@material-symbols/svg-400/outlined/check_circle.svg';
import contentCopy from '@material-symbols/svg-400/outlined/content_copy.svg';
import contentPaste from '@material-symbols/svg-400/outlined/content_paste.svg';
import darkMode from '@material-symbols/svg-400/outlined/dark_mode.svg';
import dashboard from '@material-symbols/svg-400/outlined/dashboard.svg';
import domain from '@material-symbols/svg-400/outlined/domain.svg';
import download from '@material-symbols/svg-400/outlined/download.svg';
import edit from '@material-symbols/svg-400/outlined/edit.svg';
import error from '@material-symbols/svg-400/outlined/error.svg';
import help from '@material-symbols/svg-400/outlined/help.svg';
import home from '@material-symbols/svg-400/outlined/home.svg';
import inventory2 from '@material-symbols/svg-400/outlined/inventory_2.svg';
import lightMode from '@material-symbols/svg-400/outlined/light_mode.svg';
import link from '@material-symbols/svg-400/outlined/link.svg';
import localShipping from '@material-symbols/svg-400/outlined/local_shipping.svg';
import lockOpen from '@material-symbols/svg-400/outlined/lock_open.svg';
import logout from '@material-symbols/svg-400/outlined/logout.svg';
import openInNew from '@material-symbols/svg-400/outlined/open_in_new.svg';
import pauseCircle from '@material-symbols/svg-400/outlined/pause_circle.svg';
import person from '@material-symbols/svg-400/outlined/person.svg';
import personCheck from '@material-symbols/svg-400/outlined/person_check.svg';
import qrCodeScanner from '@material-symbols/svg-400/outlined/qr_code_scanner.svg';
import refresh from '@material-symbols/svg-400/outlined/refresh.svg';
import report from '@material-symbols/svg-400/outlined/report.svg';
import schedule from '@material-symbols/svg-400/outlined/schedule.svg';
import search from '@material-symbols/svg-400/outlined/search.svg';
import thermostat from '@material-symbols/svg-400/outlined/thermostat.svg';
import undo from '@material-symbols/svg-400/outlined/undo.svg';
import verified from '@material-symbols/svg-400/outlined/verified.svg';
import warning from '@material-symbols/svg-400/outlined/warning.svg';

/** Nombres de los íconos disponibles (los de Material Symbols, en snake_case). */
export type NombreIcono =
  | 'add'
  | 'block'
  | 'cancel'
  | 'check_circle'
  | 'content_copy'
  | 'content_paste'
  | 'dark_mode'
  | 'dashboard'
  | 'domain'
  | 'download'
  | 'edit'
  | 'error'
  | 'help'
  | 'home'
  | 'inventory_2'
  | 'light_mode'
  | 'link'
  | 'local_shipping'
  | 'lock_open'
  | 'logout'
  | 'open_in_new'
  | 'pause_circle'
  | 'person'
  | 'person_check'
  | 'qr_code_scanner'
  | 'refresh'
  | 'report'
  | 'schedule'
  | 'search'
  | 'thermostat'
  | 'undo'
  | 'verified'
  | 'warning';

/** Contenido SVG de cada ícono. Es un Record: no se puede declarar un nombre sin su SVG. */
export const ICONOS: Record<NombreIcono, string> = {
  add,
  block,
  cancel,
  check_circle: checkCircle,
  content_copy: contentCopy,
  content_paste: contentPaste,
  dark_mode: darkMode,
  dashboard,
  domain,
  download,
  edit,
  error,
  help,
  home,
  inventory_2: inventory2,
  light_mode: lightMode,
  link,
  local_shipping: localShipping,
  lock_open: lockOpen,
  logout,
  open_in_new: openInNew,
  pause_circle: pauseCircle,
  person,
  person_check: personCheck,
  qr_code_scanner: qrCodeScanner,
  refresh,
  report,
  schedule,
  search,
  thermostat,
  undo,
  verified,
  warning,
};
