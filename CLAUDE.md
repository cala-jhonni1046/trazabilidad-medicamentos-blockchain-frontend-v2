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
- Los campos que pueden venir `null` se generan como opcionales pero llegan como `null`: comparar con `== null` o `??`, nunca `=== undefined`.

## Arquitectura (conservar siempre)
- `core/` (api, auth, errores, nombres, tema, layout), `shared/` (estados, ui, escaner, formato), `features/<rol>/` y `features/comun/` (pantallas de varios roles).
- `dev/`: herramientas solo de desarrollo (muestrario de diseño en `/dev`). En producción, `angular.json` reemplaza `dev.routes.ts` por `dev.routes.produccion.ts` (lista vacía) y no llegan al bundle.
- Capas: componente → página → `<pantalla>.datos.ts` → servicio generado → HttpClient. Los componentes NUNCA inyectan HttpClient ni servicios generados.
- Lecturas con `rxResource`; acciones devuelven `Promise<Resultado<T>>`.
- Errores: el interceptor resuelve lo global (sin conexión, 401, 403, 5xx); 400, 404, 409 y 503 se muestran en la pantalla con `<mc-error-api>`. El código de un 409 viene en `regla`.

## Estilo de código (obligatorio)
- Standalone, zoneless, signals (`signal`, `computed`, `input()`, `output()`), `ChangeDetectionStrategy.OnPush` en todo componente, control flow `@if/@for/@switch`.
- Formularios con Signal Forms. Guards `canMatch` por rol, rutas diferidas por rol, interceptores funcionales.
- Prefijo `mc-`. Archivos en kebab-case, en español.
- Nunca `innerHTML` con datos de la API.

## Diseño visual
- Colores SOLO con `var(--mc-*)` (`src/styles/_tokens.scss`); nunca hex en componentes. Primario solo para acciones.
- Modo claro, oscuro y sistema: atributo `data-theme` en `<html>`.
- Cada estado = color + ícono + texto, únicamente desde `shared/estados/catalogo-estados.ts` (un Record exhaustivo por enum). Nunca solo color.
- Archivo (títulos), Source Sans 3 (texto), JetBrains Mono (hashes y códigos), con @fontsource.
- Fechas: la API manda UTC con `Z`; se muestran en America/Argentina/Buenos_Aires con `shared/formato/fechas.ts`. Las de solo día (`YYYY-MM-DD`) nunca pasan por `new Date()`. Fecha con hora hacia la API: siempre con offset (`2026-10-08T15:00:00-03:00`); sin offset da 400.
- Accesibilidad AA: foco visible, contraste, etiqueta en cada campo.

## Seguridad y datos
- Nada de secretos en el código ni en `environment*.ts`: todo el bundle es público.
- JWT solo en `sessionStorage` (`mc.sesion`); la sesión se cierra al llegar a `expiraEn`. El token va solo a URLs relativas `/api/`.
- Nunca loguear el token ni datos de pacientes (R13).
- Credenciales de prueba solo por variables de entorno (`E2E_DEMO_PASSWORD`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`). `.env*` nunca a Git.

## Git
- Trabajo en `develop`; nunca commits directos en `main`.
- NUNCA `git add .`, `git add -A` ni `git commit -a`: agregar archivo por archivo y revisar `git diff --staged` antes de cada commit.
- No hacer `git push`: lo hace el autor.
- Mensajes en español: `Paso F<n>: <qué se hizo>`.
- Numeración: desde F3, los commits van uno por delante del plan de F0 (el contrato, F2 del plan, es el commit `Paso F3`; el tema, F3 del plan, es `Paso F4`; y así). Los mensajes de commit siguen siempre la numeración de los commits.
- Nunca a Git: `node_modules/`, `dist/`, `src/app/core/api/generado/`, `.env*`, reportes de Playwright.

## Comandos
`npm start` · `npm run build` · `npm test` · `npm run lint` · `npm run e2e` (todo) · `npm run e2e:lectura` · `npm run api:descargar` · `npm run api:generar` · `npm run api:verificar`

## Tests
- Unitarios (Vitest): helpers puros (GS1, fechas, errores), catálogo de estados contra los arrays generados, servicios, interceptores (`provideHttpClientTesting`), guards y componentes compartidos.
- e2e (Playwright) contra el backend real con los usuarios de la demo. `lectura` corre siempre; `flujo` necesita la base recién reseteada (`~/con-blockchain/reset-demo.sh`) y aborta si no lo está. Los estados difíciles de provocar (ALTERADA, 503) se prueban con `page.route`. Accesibilidad con axe en los dos modos.
