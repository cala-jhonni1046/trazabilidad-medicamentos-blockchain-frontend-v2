# MediChain · Frontend · Guía para agentes de código

## Principios del proyecto (siempre)
- Pensá como un desarrollador senior en cada decisión.
- Código explícito: tipos explícitos en parámetros y retornos públicos, sin `any`, nada "mágico". Una responsabilidad por archivo.
- Código explicado, en español: JSDoc breve en cada clase, componente, servicio y función exportada; comentarios donde la lógica no sea obvia. Nombres en español, como el backend.
- Paso a paso: un tema por vez. Antes de programar, explicá en pocas líneas qué vas a hacer y por qué. Al terminar: `npm run lint`, `npm run build`, `npm test` y los e2e afectados; resumen de archivos creados, modificados y borrados; esperá confirmación.
- Si algo no está claro, preguntá antes de inventar. No inventes reglas, campos ni estados.

## Qué es
Frontend Angular 22 de MediChain: trazabilidad de medicamentos (ANMAT), cadena de eventos con hash anclada en Ethereum Sepolia. Backend en otro repositorio (`~/con-blockchain`, Spring Boot), en http://localhost:8080; en desarrollo el proxy manda `/api` ahí.

## Contrato con el backend (fuente de verdad)
- `api/openapi.json` (de `/api-docs`) define endpoints, campos, estados y errores. Si el prototipo o este archivo dicen otra cosa, manda el contrato: avisá la diferencia.
- `referencia/prototipo-medichain-v3.html` es solo referencia VISUAL (pantallas, textos, disposición). Nunca de datos ni de reglas.
- El frontend NO decide reglas de negocio: no calcula bloqueos (R10), plazos (R11), permisos por provincia ni transiciones. Muestra lo que devuelve la API y sus errores tal cual.
- Ocultar acciones por rol o por `esAdminEmpresa` / `esDirectorTecnico` es solo comodidad visual; la API decide.
- Código generado en `src/app/core/api/generado/` (fuera de Git): no se edita. `npm run api:generar` corre solo antes de start, build y test.
- Cambio de contrato: `npm run api:descargar` → revisar `git diff api/openapi.json` → `npm run api:generar` → build (un valor nuevo de enum hace fallar el catálogo de estados hasta mapearlo) → tests → commit del contrato aparte.
- El cliente generado usa `rootUrl = ''` (URLs relativas `/api/...`); nunca el `servers` del contrato.
- Pedidos pendientes al backend (paso B12): `docs/pedidos-b12.md`. Un rodeo del frontend por algo que el contrato aún no resuelve se marca `// TODO B12: …` y se anota ahí.
- Los campos que pueden venir `null` se generan como opcionales pero llegan como `null`: comparar con `== null` o `??`, nunca `=== undefined`.

## Arquitectura (conservar siempre)
- `core/` (api, auth, errores, nombres, tema, layout), `shared/` (estados, ui, escaner, formato), `features/<rol>/` y `features/comun/` (pantallas de varios roles).
- `dev/`: herramientas solo de desarrollo (muestrario de diseño en `/dev`). En producción, `angular.json` reemplaza `dev.routes.ts` por `dev.routes.produccion.ts` (lista vacía) y no llegan al bundle.
- Escáner de cámara: `shared/escaner/` (`CamaraEscaner` + `mc-escaner-gs1`, cargado con `@defer` desde `mc-campo-codigo`). El detector es el nativo del navegador si lee DataMatrix; si no, `barcode-detector` (ZXing) con el `.wasm` servido desde `/zxing` (asset de `angular.json`): nunca desde un CDN.
- Accesibilidad de marco: enlace "Saltar al contenido" (`mc-saltar-al-contenido`, `<main id="contenido">`) y foco al título (`proveerFocoEnNavegacion`) en cada cambio de pantalla.
- `src/testing/`: ayudas compartidas por los tests (por ejemplo, sesiones de prueba). Sin APIs de Vitest y nunca importadas desde la aplicación.
- Listados: `core/listas/lista-paginada.ts` (`ListaPaginada`: página, tamaño, filtro por estado, error y vacío como signals) + `mat-paginator` en español (`proveerPaginadorEs()`) + `mc-filtro-estado`. Las tablas usan las clases globales `.mc-tabla`, `.mc-acciones` y `.mc-solo-lectores` de `_base.scss`. Cada recurso (listado, mosaico) falla por separado.
- Acciones que modifican datos: servicios `*.acciones.ts` (providedIn root) que usan `EjecutorAcciones`: con diálogo (`DialogoAccion`: confirma, o pide motivo / fundamento / conclusión, con un selector opcional) o directas ("Tomar"). Un rechazo de la API (404, 409…) se muestra TAL CUAL con su `regla`, dentro del diálogo o en un aviso. Las acciones que se ofrecen salen del estado y del rol solo para mostrar; la API decide.
- Capas: componente → página → `<pantalla>.datos.ts` → servicio generado → HttpClient. Los componentes NUNCA inyectan HttpClient ni servicios generados.
- Una carga que depende de un `input()` va en un `effect` (con `untracked` para lanzarla), nunca en el constructor ni en un `queueMicrotask`: el input puede no estar asignado todavía y la pantalla se queda cargando. Lo detectó un e2e entrando por el menú.
- Lecturas con `rxResource`; acciones devuelven `Promise<Resultado<T>>`.
- Errores: el interceptor resuelve lo global (sin conexión, 401, 403, 5xx); 400, 404, 409 y 503 se muestran en la pantalla con `<mc-error-api>`. El código de un 409 viene en `regla`.

## Estilo de código (obligatorio)
- Standalone, zoneless, signals (`signal`, `computed`, `input()`, `output()`), `ChangeDetectionStrategy.OnPush` en todo componente, control flow `@if/@for/@switch`.
- Formularios con Signal Forms. Todo componente con campos de Material suma `...proveerOpcionesMaterial()` a sus `providers` (campos con contorno); nunca en `app.config.ts` (arrastraría `@angular/forms` al bundle inicial). Guards `canMatch` por rol, rutas diferidas por rol, interceptores funcionales.
- Prefijo `mc-`. Archivos en kebab-case, en español.
- Nunca `innerHTML` con datos de la API.

## Diseño visual
- Colores SOLO con `var(--mc-*)` (`src/styles/_tokens.scss`); nunca hex en componentes. Primario solo para acciones.
- Modo claro, oscuro y sistema: atributo `data-theme` en `<html>`.
- Cada estado = color + ícono + texto, únicamente desde `shared/estados/catalogo-estados.ts` (un Record exhaustivo por enum) y mostrado con `<mc-estado>`. Nunca solo color.
- Íconos: Material Symbols registrados de a uno en `shared/ui/iconos.ts` (SVG importados como texto) y mostrados con `<mc-icono nombre="…" />`. Para uno nuevo: importar su SVG y sumarlo a `ICONOS`.
- Menú lateral de cada rol: solo en `core/layout/navegacion.ts` (un Record por rol). Cada pantalla nueva suma su entrada ahí. El resaltado usa `routerLinkActive` por prefijo, salvo la entrada que es prefijo de otra del mismo menú (el inicio del rol, `/farmacia` y `/farmacia/stock`): esa se resalta solo con la ruta exacta (`resaltarSoloSiEsExacta`); `shell-app.spec.ts` comprueba, para cada rol y cada entrada, que se resalta UNA sola.
- Archivo (títulos), Source Sans 3 (texto), JetBrains Mono (hashes y códigos), con @fontsource.
- Fechas: la API manda UTC con `Z`; se muestran en America/Argentina/Buenos_Aires con `shared/formato/fechas.ts`. Las de solo día (`YYYY-MM-DD`) nunca pasan por `new Date()`. Fecha con hora hacia la API: siempre con offset (`2026-10-08T15:00:00-03:00`); sin offset da 400.
- Accesibilidad AA: foco visible, contraste, etiqueta en cada campo. Todo lo que no es la pantalla inicial se carga diferido (bundle inicial de ~340 kB: el snackbar de `AvisosService` se importa bajo demanda; no importar Material en `app.config.ts` ni en servicios globales).

## Seguridad y datos
- Nada de secretos en el código ni en `environment*.ts`: todo el bundle es público.
- JWT solo en `sessionStorage` (`mc.sesion`); la sesión se cierra al llegar a `expiraEn`. El token va solo a URLs relativas `/api/`.
- Nunca loguear el token ni datos de pacientes (R13).
- Credenciales de prueba solo por variables de entorno o en `.env.e2e` (`E2E_DEMO_PASSWORD`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`). `.env*` nunca a Git (salvo las plantillas con valores vacíos). El agente nunca lee `.env.e2e` (ver sección e2e).

## Git
- Trabajo en `develop`; nunca commits directos en `main`.
- NUNCA `git add .`, `git add -A` ni `git commit -a`: agregar archivo por archivo y revisar `git diff --staged` antes de cada commit.
- No hacer `git push`: lo hace el autor.
- Mensajes en español: `Paso F<n>: <qué se hizo>`.
- Numeración: desde F3, los commits van uno por delante del plan de F0 (el contrato, F2 del plan, es el commit `Paso F3`; el tema, F3 del plan, es `Paso F4`; y así). Los mensajes de commit siguen siempre la numeración de los commits.
- Nunca a Git: `node_modules/`, `dist/`, `src/app/core/api/generado/`, `.env*`, reportes de Playwright.

## Comandos
`npm start` · `npm run build` · `npm test` · `npm run lint` · `npm run e2e` (todos; solo el autor) · `npm run e2e:lectura` · `npm run e2e:flujo` (solo el autor) · `npm run api:descargar` · `npm run api:generar` · `npm run api:verificar`

## Tests
- Unitarios (Vitest): helpers puros (GS1, fechas, errores), catálogo de estados contra los arrays generados, servicios, interceptores (`provideHttpClientTesting`), guards y componentes compartidos.
- e2e (Playwright) contra el backend real con los usuarios de la demo. Los estados difíciles de provocar (ALTERADA, 503) se prueban con `page.route`. Accesibilidad con axe en los dos modos.

### e2e: quién los corre
- `lectura` (no modifica datos): los puede correr el agente SOLO si existe `.env.e2e` en la raíz del frontend; si no existe, los corre el autor.
- `flujo` (modifica datos): los corre SOLO el autor, a mano, con `npm run e2e:flujo`. El agente los escribe pero NUNCA los corre, y nunca corre `npm run e2e` (corre `lectura` Y `flujo`): usa siempre `npm run e2e:lectura`. Tampoco corre `reset-demo.sh`.
  - Cada test de flujo dice en su cabecera qué deja en la base. Los de asignación (`e2e/flujo/asignacion.spec.ts`) **dejan una empresa pendiente (con su cuenta de administrador) por corrida**: registran una farmacia por la API pública con CUIT, GLN, email y contraseña únicos de esa corrida (generados en `e2e/soporte/identificadores.ts`; nada es un secreto) y la asignan desde la pantalla. No necesitan `reset-demo.sh`, pero la base se va llenando: antes de la demo final, el autor corre `~/con-blockchain/reset-demo.sh`.
  - Si un flujo necesita datos deterministas (base recién reseteada), debe abortar con un mensaje claro si no los encuentra.
- Credenciales: variables de entorno (valores del `.env` del backend; nunca en el código ni en Git):

  | Variable | Qué es |
  |---|---|
  | `E2E_DEMO_PASSWORD` | Contraseña de los usuarios de la demo (`*.demo`): `DEMO_PASSWORD` del backend |
  | `E2E_ADMIN_EMAIL` | Email de la cuenta de la Sede Central: `ADMIN_EMAIL` del backend |
  | `E2E_ADMIN_PASSWORD` | Contraseña de esa cuenta: `ADMIN_PASSWORD` del backend |

- `.env.e2e` (lo crea el autor a partir de `.env.e2e.ejemplo`): `playwright.config.ts` lo carga con `process.loadEnvFile` si existe; una variable ya exportada en la terminal gana. Está en `.gitignore`.
- **`.env.e2e` es intocable para el agente:** nunca leerlo, imprimirlo, copiarlo, moverlo ni commitearlo. Prohibido `cat`, `head`, `grep`, `Read` o cualquier herramienta sobre su contenido, y prohibido mostrar variables de entorno con sus valores (`env`, `printenv`, `echo $E2E_…`). Solo se puede comprobar que existe (`test -f .env.e2e`).
- Preparación (una sola vez): `npx playwright install chromium` (lo instala el autor).
- Cómo se corren: backend levantado y `npm start` (frontend en :4200); en otra terminal, `npm run e2e:lectura` o `npm run e2e` (los dos grupos; solo el autor). `npm run e2e:tipos` solo compila los e2e (no necesita backend ni credenciales). Si falta una variable, el test falla diciendo cuál. `E2E_BASE_URL` (opcional) cambia la dirección del frontend. El grupo `flujo` vive en `e2e/flujo`.
- Al informar una corrida, mostrar el resumen y el error de cada test que falle; nunca credenciales.
