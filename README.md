# MediChain · Frontend

Frontend Angular 22 de MediChain: trazabilidad de medicamentos (ANMAT) del laboratorio al paciente,
con una cadena de eventos con hash anclada en Ethereum Sepolia. El backend (Spring Boot) está en otro
repositorio y es la **fuente de verdad** de endpoints, estados, reglas y errores: el frontend muestra lo
que devuelve y no decide reglas de negocio.

## Pantallas por rol

| Rol | Pantallas |
|---|---|
| Público | Ingresar · Verificar una caja (GTIN + serie, código pegado o cámara) |
| Sede Central | Tablero · Inspectores · Empresas · Circuitos · Cadena y Sepolia · Usuarios |
| Inspector ANMAT | Bandeja · Empresas · Circuitos · Lotes y cuarentenas · Reportes · Cadena y Sepolia |
| Laboratorio | Circuitos · Medicamentos · Lotes · Bultos · Viajes · Equipo |
| Distribuidora | Circuitos · Recibir bultos · Depósito · Viajes · Equipo |
| Farmacia | Circuitos · Por recibir · Stock · Dispensar · Equipo |
| Paciente | Verificar y reportar · Mis reportes |

## Cómo se usa

Requisitos: Node 22 y el backend en `http://localhost:8080` (con `SWAGGER_HABILITADO=true` para el contrato).

```
npm install            # instala y genera el cliente de la API (api/openapi.json → src/app/core/api/generado)
npm start              # http://localhost:4200 ; el proxy manda /api al backend
npm run build          # build de producción
npm test               # tests unitarios (Vitest)
npm run lint
npm run api:descargar  # baja el contrato del backend a api/openapi.json (--archivo <ruta> para usar un archivo)
npm run api:verificar  # compara api/openapi.json con el del backend
npm run e2e:lectura    # e2e (Playwright) que no modifican datos; ver más abajo
```

## Tests e2e

Corren contra el backend real y necesitan `npx playwright install chromium` (una vez) y las credenciales de
la demo en `.env.e2e` (plantilla: `.env.e2e.ejemplo`; ese archivo nunca va a Git). Los de `e2e/flujo`
**modifican datos** y se corren a mano (`npm run e2e:flujo`); los de `e2e/lectura` no. Detalles en `CLAUDE.md`.

## Más información

- `CLAUDE.md`: arquitectura, estilo, diseño, seguridad, Git y reglas de trabajo.
- `docs/pedidos-b12.md`: lo que el frontend resuelve con un rodeo y se le pide al backend (paso B12).
- `referencia/prototipo-medichain-v3.html`: prototipo anterior, solo referencia visual.

## Seguridad

- El JWT vive en `sessionStorage` y la sesión se cierra al llegar a `expiraEn`.
- Ninguna credencial está en el código. El token solo se envía a URLs relativas `/api/`.
- El binario de ZXing (escáner) se sirve desde `/zxing` (sin CDN). Con una política de seguridad estricta
  (CSP) hay que permitir `'wasm-unsafe-eval'` para ese binario.
