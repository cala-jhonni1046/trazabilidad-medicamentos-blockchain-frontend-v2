# Guion de la demo de MediChain

Recorrido paso a paso por rol, con la cuenta a usar, la pantalla que abrir, qué mostrar y qué significa cada estado.
Está escrito para quien presenta. Dura unos 25 minutos completo; los bloques marcados **(opcional)** se pueden saltear.

Los datos son los de `DatosDemo` del backend (`~/con-blockchain`) sobre una base **recién reseteada**. Todo es ficticio y
está en Mendoza. Si ya operaste sobre la base, los códigos y cantidades pueden no coincidir: reseteá antes de presentar.

## 0. Antes de empezar

1. `~/con-blockchain/reset-demo.sh` (escribí `BORRAR`) y después `./levantar.sh`: esperá "Datos de demo cargados".
   - El anclaje en Sepolia está **apagado** (`ANCLAJE_HABILITADO=false`): el bloque de blockchain dice "No disponible".
     Es lo esperado y se explica en el recorrido; no es un error.
   - Los e2e de flujo (`npm run e2e:flujo`) dejan datos en la base: si los corriste, volvé a resetear.
2. En este repo: `npm start` (http://localhost:4200). El proxy manda `/api` al backend en :8080.
3. Tené a mano la contraseña de las cuentas demo (`DEMO_PASSWORD` del `.env` del backend) y la de la Sede (`ADMIN_EMAIL` y
   `ADMIN_PASSWORD`). Nada de eso está en el repositorio.
4. Abrí dos ventanas del navegador (una normal y una de incógnito) para cambiar de rol sin salir cada vez: la sesión vive
   en `sessionStorage`, así que cada pestaña tiene la suya, y se cierra a las 8 h o al apretar "Salir".
5. El tema se elige arriba a la derecha (Claro, Oscuro, Sistema). Conviene mostrar el oscuro una vez: cada estado se ve con
   color + ícono + texto, nunca solo con color.

### Cuentas

Todas con `DEMO_PASSWORD`, salvo la Sede.

| Rol | Cuenta | Quién es |
|---|---|---|
| Sede Central ANMAT | `ADMIN_EMAIL` del backend | Administra inspectores y asigna lo que no tiene inspector |
| Inspector | `inspector.mendoza@medichain.demo` | Rocío Quiroga, inspectora de Mendoza |
| Laboratorio | `admin@laboratorio-andino.demo` | Elena Sosa, administradora y directora técnica de Laboratorio Andino Cuyano |
| Distribuidora | `admin@distribuidora-piedemonte.demo` | Pablo Funes, Distribuidora Piedemonte (cadena A) |
| Farmacia | `admin@farmacia-losalamos.demo` | Martín Videla, Farmacia Los Álamos (cadena A) |
| Farmacia | `admin@farmacia-cerroarco.demo` | Lucía Ortiz, Farmacia Cerro Arco (cadena A, circuito todavía sin aprobar) |
| Distribuidora | `admin@distribuidora-valleuco.demo` | Ramiro Gil, Distribuidora del Valle de Uco (cadena nueva) |
| Farmacia | `admin@farmacia-parque.demo` | Julieta Castro, Farmacia del Parque (cadena nueva) |
| Paciente | `paciente@medichain.demo` | Tomás Aguirre |

### Qué hay en la base

**Cadena A** (la de la historia en vivo, casi sin mover):

- Circuito **CIR-0001** Andino → Piedemonte → Los Álamos, **Aprobado**. **CIR-0002** Andino → Piedemonte → Cerro Arco,
  **Esperando a las empresas** (ninguna aceptó todavía).
- Lote **L2026-0001** (Cuyafen, 20 cajas, **Liberado**). Sus bultos: **BUL-0001** (10 cajas) en el viaje **VJ-0001**,
  **Programado**, y **BUL-0002** (10 cajas), **Armado** y sin viaje.
- Lote **L2026-0002** (Andivax, vacuna **biológica**, 10 cajas), **Pendiente de liberación**.
- Reporte **REP-0001** del paciente, **Abierto**: una caja de Cuyafen con la serie `FALSA00099`, que no existe.

**Cadena nueva** (para ver stock, depósito y un viaje en curso; no se toca en el recorrido principal):

- Circuito **CIR-0003** Andino → Distribuidora del Valle de Uco → Farmacia del Parque, **Aprobado**.
- Lote **L2026-0010** (Cuyafen, 12 cajas, **Liberado**), repartido así:

  | Dónde | Qué | Estado |
  |---|---|---|
  | Farmacia del Parque | **BUL-0003**, 4 cajas | Bulto **Recibido**, cajas **En stock** |
  | Depósito de Uco | **BUL-0004**, 3 cajas | Bulto **En depósito** |
  | En la ruta | **BUL-0005**, 3 cajas, viaje **VJ-0004** | Bulto y cajas **En tránsito**, con 3 lecturas de temperatura en rango |
  | Laboratorio | 2 cajas sueltas | **En laboratorio** |

  Los viajes **VJ-0002** (laboratorio → Uco, con los tres bultos) y **VJ-0003** (Uco → Parque, con BUL-0003) ya están
  **Finalizados**.
- Lote **L2026-0011** (Cuyafen, 5 cajas) **En cuarentena** por una medida **Preventiva** **Activa**.

## 1. Qué significa cada estado

Cada estado se ve con **color + ícono + texto** (nunca solo color) y sale del catálogo de estados del frontend. Las reglas
las decide siempre el backend: el cliente muestra lo que devuelve y sus errores tal cual.

| Tono | Significa |
|---|---|
| Verde (correcto) | Terminó bien o está en orden |
| Ámbar (atención) | Espera una acción de alguien |
| Rojo (crítico) | Algo salió mal o está frenado |
| Celeste (tránsito) | Está en movimiento |
| Violeta (blockchain) | Espera el registro en la blockchain |
| Gris (neutro) | Informativo |

| Qué | Estados (y qué quieren decir) |
|---|---|
| **Empresa** | Pendiente (espera al inspector) · Habilitada (puede operar) · Rechazada · Suspendida |
| **Circuito** | Esperando a las empresas (falta que acepten la distribuidora y la farmacia) · Esperando al inspector · Aprobado · Rechazado · Suspendido |
| **Lote** | Pendiente de liberación · Liberado (se puede armar y despachar) · En cuarentena (bloqueado) · Recall (retiro del mercado, definitivo) |
| **Bulto** | Armado · En tránsito · En depósito (en la distribuidora) · Recibido (en la farmacia) · Rechazado · Robado · Desarmado |
| **Viaje** | Programado · En tránsito · Finalizado (todos sus bultos se recibieron o rechazaron) · Robado · Cancelado |
| **Caja** | En laboratorio · En tránsito · En depósito · En stock (en la farmacia) · Dispensada · Devuelta · Robada · Rechazada |
| **Medida sanitaria** | Activa (bloquea) · Levantada · Recall |
| **Reporte ciudadano** | Abierto · En investigación · Cerrado |
| **Verificación pública** | Apta · Ya dispensada (caso normal de una caja en manos de un paciente) · Bloqueada · Robada · En distribución · No existe |
| **Anclaje de una caja** | Confirmado · Enviado, esperando confirmaciones · Pendiente de anclaje · **No disponible** (el anclaje está apagado en el servidor: es lo que vas a ver) |
| **Cadena vs. blockchain** | Verificada · Alterada · No consultada (la red no respondió) · **No disponible** (anclaje apagado) |

**Bloqueada (R10)** no es un estado guardado: se calcula. Una caja está bloqueada si su lote, su bulto o su viaje tiene una
medida sanitaria activa, o si el lote venció. Una caja bloqueada no viaja, no se recibe y no se dispensa. La pantalla
dice por qué ("Bloqueado: el lote L2026-0011 está en CUARENTENA").

## 2. Recorrido

### 2.1 Sin cuenta: verificar un medicamento (3 min)

Pantalla `/verificar` (desde "Ingresar" → "Verificalo sin ingresar"). No pide ningún dato personal (R13).

1. GTIN `07799000001010` y serie `L20260010S000001` → **Apta**. Se ve el producto (Cuyafen, Ibuprofeno · 400 mg), el
   laboratorio, el lote, el vencimiento y el **Recorrido**: Fabricado y Liberado (Andino), Despachado (Andino), Despachado
   (Valle de Uco), Recibido (Valle de Uco) y Recibido (Farmacia del Parque). Las etapas se ordenan por día, así que dentro
   de un mismo día los despachos van antes que las recepciones.
2. El bloque **Registro en blockchain** dice **No disponible**. Explicalo: con el anclaje prendido, acá aparecería la
   transacción de Sepolia y el enlace a Etherscan para comprobarlo de forma independiente.
3. Serie `FALSA00099` → **No existe**, con el mensaje de la API ("puede ser falsificada, no la consumas y denunciala").
4. Probá "Pegar el código completo" (un código GS1 o `GTIN serie`) y, si hay cámara, "Escanear con la cámara".

### 2.2 Registrarse (opcional, 2 min)

- `/registrar-paciente`: nombre, apellido, DNI, correo y contraseña. Se crea la cuenta.
- `/registrar-empresa`: tipo, CUIT, GLN, provincia, domicilio, **PDF de habilitación** y el administrador inicial. La empresa
  queda **Pendiente**: la revisa un inspector de su provincia. Si la provincia **no tiene inspectores** (por ejemplo Salta),
  llega a la Sede, que la asigna (ver 2.3).
- Mostrá un error de la API: un CUIT inválido se marca en su campo; un CUIT repetido da un 409 `EMPRESA_DUPLICADA` arriba.

### 2.3 Sede Central (3 min)

Ingresá con la cuenta de la Sede. Pantalla **Tablero**.

1. Los **7 mosaicos** salen de **un solo pedido** (`GET /api/tablero/resumen`): empresas, empresas pendientes, inspectores
   activos, circuitos aprobados, cuarentenas activas, eventos de la cadena y **anclajes confirmados** (0: anclaje apagado).
2. **Solicitudes de habilitación sin inspector** y **Circuitos sin inspector**: lo que ningún inspector puede tomar porque
   su provincia no tiene inspectores activos. Si registraste una empresa de Salta en 2.2, está acá: **Asignar** → elegir un
   inspector → "Asignado a …". La API decide si corresponde; si no, se ve su error (R2).
3. **Inspectores**: la lista con nombre, legajo, provincia y estado (Activo / Baja). "Dar de alta" crea uno nuevo;
   "Dar de baja" lo desactiva y devuelve sus solicitudes tomadas a la bandeja.
4. **Empresas** y **Circuitos**: listados con filtro por estado; la Sede puede suspender y rehabilitar. El PDF de la
   habilitación se descarga desde Empresas.
5. **Cadena y Sepolia**: "Verificar la cadena" recalcula todos los hashes: la cadena local da **íntegra** y la comparación con
   Sepolia dice **No disponible**. "Anclar ya" responde 409 `ANCLAJE_DESHABILITADO`: mostralo, es la API diciendo la verdad.
6. **Trazabilidad**: ver 2.9.

### 2.4 Inspector (4 min)

Cuenta `inspector.mendoza@medichain.demo`. Pantalla **Pendientes de tu acción**.

1. El **menú tiene insignias** con los pendientes de cada bandeja (un solo pedido, `GET /api/tablero/bandeja-inspector`). En la
   demo: Lotes y cuarentenas 2 (un biológico por liberar y una cuarentena), Reportes 1, y la Bandeja suma todo.
2. **Biológicos por liberar**: el lote **L2026-0002** (Andivax). **Liberar** → pasa a **Liberado**. Solo un inspector libera
   un biológico (R4): al director técnico del laboratorio no le corresponde (ver 2.5).
3. **Cuarentenas por revisar**: la medida sobre **L2026-0011** (Preventiva, Activa). Como la abrió esta inspectora, ya es
   suya: **Levantar** (pide un fundamento) la deja **Levantada** y el lote vuelve a **Liberado**; **Recall** la convierte en
   retiro del mercado (definitivo). Dejala activa si querés mostrar el bloqueo en el laboratorio (2.5).
4. **Reportes ciudadanos**: **REP-0001**. "Ver caja" muestra que no existe; **Tomar el caso** pasa a **En investigación** y
   después se **cierra con una conclusión**. El paciente ve el estado, nunca la conclusión.
5. **Circuitos**: el **CIR-0002** todavía no aparece acá: espera a las empresas. En vivo, entrá como Piedemonte y como
   Cerro Arco y **aceptá** el circuito (Circuitos → "Esperan tu aceptación"): pasa a **Esperando al inspector** y entonces
   aparece en la bandeja: **Tomar** → **Aprobar**. (Las empresas solo operan si están habilitadas: R2 y R5.)

### 2.5 Laboratorio (5 min)

Cuenta `admin@laboratorio-andino.demo` (administradora y directora técnica).

1. **Circuitos**: CIR-0001 y CIR-0003 aprobados, CIR-0002 esperando. "Proponer un circuito" se hace buscando por CUIT.
2. **Medicamentos**: Cuyafen (común) y Andivax (biológico, entre 2 y 8 °C).
3. **Lotes**: L2026-0011 aparece **En cuarentena** y **bloqueado** con su motivo (R10). En L2026-0002 aparece "Liberar":
   probalo antes de que lo libere la inspectora y la API responde **409 R4** ("lo libera un inspector"): el botón es solo
   comodidad, **el permiso real lo decide la API**. "Registrar un lote" crea uno nuevo (series generadas por el servidor) y
   el DT lo **Libera**.
4. **Bultos**: BUL-0001 y BUL-0002 **Armados** (con "Desarmar" si no tienen viaje); BUL-0003 a BUL-0005 de la cadena nueva.
   Cada bulto muestra el lote, el circuito (`CIR-0001`), la farmacia de destino y la distribuidora por la que pasa.
   "Armar un bulto": cajas de un lote liberado, con precinto, para una farmacia con circuito aprobado.
5. **Viajes · tramo 1**: **VJ-0001** **Programado**: **Registrar salida** lo pasa a **En tránsito** y recién entonces se
   pueden cargar temperaturas. "Armar un viaje" lleva bultos Armados hacia una distribuidora. En VJ-0002 (Finalizado),
   **Temperatura** abre el gráfico de lecturas.
6. **Ruptura de la cadena de frío (R9), en vivo** (opcional): con VJ-0001 en tránsito, en `~/con-blockchain` corré
   `SENSOR_PASSWORD='<DEMO_PASSWORD>' python3 scripts/simular-sensor.py --email admin@laboratorio-andino.demo --viaje VJ-0001 --lecturas 3 --intervalo 2 --romper-en 3`.
   La tercera lectura sale de rango: el backend abre solo una **cuarentena sobre el bulto** y el viaje; la caja pasa a
   **Bloqueada**. Al **Recibirlo**, la distribuidora lo **rechaza automáticamente** (motivo "bulto bloqueado").

### 2.6 Distribuidora Piedemonte (3 min)

Cuenta `admin@distribuidora-piedemonte.demo`.

1. **Recibir bultos** ("Escanear un bulto"): solo recibe la empresa destino y con el viaje en tránsito. Se escribe o escanea
   el código del bulto, y se informa precinto intacto, cantidad contada y temperatura de llegada. **El servidor decide** si
   es conforme: precinto roto, cantidad distinta o temperatura fuera del rango del medicamento → **Rechazado** (y una
   cuarentena sobre el bulto). Registra un bulto inexistente o ya recibido y queda en la cadena igual (404 / 409).
2. **Depósito**: los bultos **En depósito** de esta empresa. **Viajes · tramo 2**: "Armar un viaje" con bultos del depósito
   hacia una o más farmacias (**Registrar salida**, **Cancelar**, **Reportar robo** → bulto y cajas **Robados**: R14).
3. Los viajes tienen **filtro por estado**: elegí "En tránsito" y mirá cómo la tabla se acota (lo filtra la API dentro de
   lo que esta empresa ya ve).

### 2.7 Farmacia: la cadena nueva (5 min)

Cuenta `admin@farmacia-parque.demo` (Julieta, Farmacia del Parque).

1. **Stock** son **dos tarjetas**, cada una con su paginador: **En stock** (4 cajas del lote L2026-0010, con "Devolver") y
   **En camino** (3 cajas **En tránsito**, todavía no recibidas: sin acciones).
2. **Por recibir**: "En camino hacia vos" lista el viaje **VJ-0004** con su origen (Distribuidora del Valle de Uco). **Recibir**
   el bulto **BUL-0005** (escaneándolo o escribiendo el código; precinto intacto, 3 cajas, 20 °C dentro de 15–30 °C) → vuelve
   a **Stock** y las 3 cajas pasan de **En camino** a **En stock**.
3. **Dispensar**: GTIN, serie y número de receta (obra social y afiliado, o "particular"). El DNI es opcional y la API lo
   guarda **enmascarado** (`*****006`): el completo nunca se persiste ni se muestra (R13). Una caja se dispensa **una sola
   vez** (R11): repetirla da el 409 `R11`. Se puede **anular dentro de las 2 horas** (vuelve a **En stock**).
4. **Devolver** una caja en stock (motivo y observación): pasa a **Devuelta** y no vuelve a dispensarse.
5. Volvé a **2.1** con una caja que dispensaste: ahora la verificación pública dice **Ya dispensada** y el recorrido termina
   en la recepción de la farmacia (**nada de la dispensación**: R13).

Si querés contrastar con la cadena A: **Los Álamos** y **Cerro Arco** no tienen stock todavía. Para que Los Álamos lo tenga hay
que completar el trayecto de BUL-0001 y BUL-0002: el laboratorio los despacha a Piedemonte (2.5), Piedemonte los recibe y los
manda a la farmacia (2.6), y la farmacia los recibe.

### 2.8 Distribuidora del Valle de Uco (2 min)

Cuenta `admin@distribuidora-valleuco.demo`.

1. **Depósito**: **BUL-0004**, 3 cajas, **En depósito**, del circuito **CIR-0003**, para la Farmacia del Parque.
2. **Viajes · tramo 2**: **VJ-0004** **En tránsito**. **Temperatura** abre el gráfico con 3 lecturas dentro del rango de Cuyafen
   (todas en verde). VJ-0003 y VJ-0002 están **Finalizados**.

### 2.9 Trazabilidad por código (3 min)

Entrada **Trazabilidad** del menú de la Sede, el inspector, el laboratorio, las distribuidoras y las farmacias (el paciente
no la tiene). Buscá **un lote, un bulto o una caja** y ves **todo lo que pasó**, en el orden de la cadena, con el hash de cada evento.

1. Lote `L2026-0010`: registro, liberación y la medida si la hubiera. El **laboratorio** aparece en cada resultado porque un
   código de lote puede repetirse entre laboratorios.
2. Bulto `BUL-0003`: su armado, los viajes que lo llevaron (VJ-0002 y VJ-0003), la recepción en Uco y la recepción en la
   farmacia.
3. Caja `07799000001010` + `L20260010S000001`: lo de su lote **y** lo de su bulto, de punta a punta.
4. **El alcance lo resuelve el backend**: cada rol ve solo lo que ya ve de esa entidad (lo ajeno responde 404 y el mensaje se
   muestra tal cual). Probalo con la Farmacia Cerro Arco buscando `L2026-0010`: no es de su circuito.
5. **R13**: de cada evento solo se muestran número, tipo, entidad, fecha y hash. Nunca datos del paciente ni de la dispensación.

### 2.10 Paciente (2 min)

Cuenta `paciente@medichain.demo`. Pantalla **Verificar un medicamento** (la misma de 2.1, pero con sesión) y
**Reportar un problema con una caja**: GTIN, serie, qué pasó, provincia donde la consiguió y una descripción que queda solo
en su reporte. Después **Mis reportes**: el nuevo aparece **Abierto**, en la bandeja de los inspectores de Mendoza. El
paciente ve el estado, no la conclusión.

## 3. Si algo sale distinto

| Qué ves | Qué es |
|---|---|
| "No hay conexión con el servidor" | El backend no está en :8080 o el proxy no llega: `./levantar.sh` |
| Todos los mosaicos del tablero con "—" | Falló el resumen (`/api/tablero/resumen`): se ve el error y el resto de la pantalla sigue |
| 409 con un código chico (`R4`, `R10`, `R11`…) | Una regla de negocio del backend: el mensaje y el código se muestran tal cual, nunca los inventa el cliente |
| 404 en una búsqueda de trazabilidad | Lo que buscás no existe o no es de tu empresa/rol |
| "No disponible" en blockchain | El anclaje está apagado. Para mostrarlo prendido hay que desplegar un contrato nuevo (`scripts/nuevo-contrato.sh --simular` / `--desplegar` en el backend: la simulación no gasta nada) |
| La sesión se cerró sola | Pasaron 8 horas, o la cuenta se desactivó: volvé a ingresar |
| Faltan las cajas o los bultos de la cadena nueva | Se consumieron en una corrida anterior: reseteá la base |

## 4. Mensajes que conviene decir

- **El frontend no decide reglas.** Cada permiso, bloqueo y plazo lo decide el backend; ocultar un botón es solo comodidad.
- **Cada estado es color + ícono + texto**, también en el modo oscuro.
- **La cadena se verifica sola:** cada evento lleva el hash del anterior y, con el anclaje prendido, el último hash se guarda en
  Ethereum Sepolia cada 5 minutos: ni quien administra la base puede reescribir la historia sin que se note.
- **Nada de datos personales** en lo público, en los eventos ni en la verificación (R13, Ley 25.326).
