# Quiz #2 · Opción 2: Control de inventario para una empresa de construcción

Solución construida por el **Camino 2: back end propio** (Node.js + Express + Sequelize + MySQL).
Todas las automatizaciones (alertas, avisos y revisión diaria programada) corren dentro del mismo servidor; no se usa n8n.

Los datos de ejemplo representan a **Constructora Del Valle S.A.** con los datos de la Parte A del enunciado:
las órdenes de octubre del ejercicio A3 y los materiales del ejercicio A5.

## Requisitos mínimos del enunciado y dónde se cumplen

| Requisito | Cómo se resolvió |
|---|---|
| Materiales con stock mínimo, máximo, demanda promedio y tiempo de entrega; **el punto de reorden se calcula, no se digita** | Campos nuevos en `productos`. `stock_seguridad` y `punto_reorden` son campos calculados (no existen en la tabla). Si se intentan enviar, la API responde 400. |
| Movimientos (entrada, salida, traslado, ajuste) con fecha, usuario, cantidad, ubicación y documento de origen; **el stock sale de los movimientos** | Tabla `movimientos`. El usuario se toma del token. El stock de cada bodega es la suma de lo que entró menos lo que salió. La tabla `existencias` es solo un resumen que el sistema reescribe en cada movimiento y que ya no se puede editar a mano. |
| Alerta de reorden cuando el stock cae por debajo del punto de reorden | Tabla `alertas_reorden`, que se abre, se escala y se cierra sola. Aviso opcional a Slack o Discord por webhook. Consulta en vivo: `GET /api/alertas/reorden`. |
| Detección de posibles compras duplicadas (regla definida y documentada) | `GET /api/ordenes/posibles-duplicados`, con la regla explicada abajo y configurable. |
| Trazabilidad: historial de un material y de qué OC viene cada entrada | `GET /api/productos/:id/trazabilidad` |

## Modelo de datos (tablas nuevas o cambiadas)

```
productos ──< movimientos >── bodegas (origen)
    │              │  └─────── bodegas (destino)
    │              ├── usuarios      (quién lo registró)
    │              ├── ordenes_compra (de qué OC viene una entrada)
    │              └── recepciones   (en qué recepción llegó)
    └──< alertas_reorden >── movimientos (cuál la disparó)
```

- **productos**: agrega `stock_minimo`, `stock_maximo`, `demanda_promedio`, `demanda_maxima` y `tiempo_entrega` (días).
- **movimientos**: `tipo`, `fecha`, `cantidad` (> 0), `documento_tipo`, `documento_numero`, `observaciones`, `producto_id`, `bodega_origen_id`, `bodega_destino_id`, `usuario_id`, `orden_id`, `recepcion_id`. No se editan ni se borran: un error se corrige con un ajuste.
- **alertas_reorden**: `estado` (abierta / cerrada), `prioridad` (urgente / reponer), `stock`, `punto_reorden`, `cantidad_sugerida`, `cerrada_en`, `producto_id`, `movimiento_id`.

El script completo está en [`database.sql`](../database.sql) (tablas 18 y 19).

## Reglas de negocio

### Punto de reorden (ejercicio A5)

```
SS = (demanda diaria máxima − demanda diaria promedio) × tiempo de entrega
PR = demanda diaria promedio × tiempo de entrega + SS
```

| Estado | Condición | Significado |
|---|---|---|
| `urgente` | stock ≤ d × L | Aunque se pida hoy, se agota antes de que llegue |
| `reponer` | stock ≤ PR | Llegó al punto de reorden: hay que pedir |
| `ok` | stock > PR | — |
| `sin_parametros` | falta la demanda o el tiempo de entrega | No se puede calcular |

- **Cantidad sugerida:** lo que falta para llegar al stock máximo. Si el material no tiene máximo, lo que falta para llegar a PR + d × L.
- **Prioridad:** primero los urgentes. Dentro de cada grupo va primero el material con menos holgura, es decir, días de cobertura (stock ÷ d) menos el tiempo de entrega.
- Con los datos de A5: cemento (PR 165) y varilla (PR 800) están bien; **arena** (PR 20) y **block** (PR 3 600) deben reponerse, y la arena va primero.

### Movimientos

| Tipo | Bodegas | Documento | Reglas |
|---|---|---|---|
| `entrada` | solo destino | `orden_compra` o `inventario_inicial` | La OC debe estar aprobada, incluir el material y no recibir más de lo pedido |
| `salida` | solo origen | `vale_salida` | No puede dejar la bodega en negativo |
| `traslado` | origen y destino distintos | `boleta_traslado` | No cambia el stock total de la empresa |
| `ajuste` | origen (faltante) **o** destino (sobrante) | `ajuste_inventario` | Exige el motivo en `observaciones` |

- Cuando una OC se recibe completa, pasa sola a `recibida`.
- A una bodega inactiva no se le puede meter material, pero sí sacárselo.
- Cada movimiento corre en una transacción y bloquea la existencia afectada. Así dos salidas al mismo tiempo no pueden dejar stock negativo.
- Una recepción que ya generó entradas no se puede borrar ni cambiar de orden o de bodega.

### Posibles compras duplicadas

Dos órdenes **no anuladas** son posibles duplicadas si cumplen todo esto:
1. son del mismo proveedor,
2. sus fechas están a **7 días** o menos (`DUPLICADOS_DIAS`),
3. comparten al menos un artículo, y
4. la cantidad de ese artículo difiere en un **10 %** o menos (`DUPLICADOS_TOLERANCIA`).

El nivel es **alta** si la cantidad es idéntica y hay 1 día o menos de diferencia; si no, es **media**.
Con los datos de A3 encuentra **OC-1041 / OC-1042** (alta, ₡1 290 000 en riesgo) y **OC-1050 / OC-1053** (media, 4 % de diferencia).
Los dos parámetros se pueden cambiar en cada consulta: `?dias=3&tolerancia=0`.

## Automatizaciones (en el back end)

1. **Con cada movimiento** se recalcula el stock y se evalúa la alerta del material:
   - Si llega al punto de reorden, se abre una alerta.
   - Si pasa a urgente, la alerta se escala.
   - Si el stock se recupera, la alerta se cierra.
   - Al abrirse o escalarse, se envía un aviso al webhook.
2. **Al cambiar la demanda o el tiempo de entrega** de un material, se vuelve a evaluar su alerta.
3. **Revisión diaria programada** (`src/services/tareas.js`) a la hora `TAREAS_HORA`:
   - recalcula las alertas de todos los materiales,
   - busca duplicados recientes o con órdenes todavía abiertas,
   - y envía un resumen al webhook.

   Para la demo se puede lanzar a mano con `POST /api/tareas/revision-diaria`.

Variables en `backend/.env` (todas opcionales):

| Variable | Por defecto | Uso |
|---|---|---|
| `ALERTAS_WEBHOOK_URL` | vacío | URL de un webhook entrante de Slack o Discord. Vacío = solo tabla y consola |
| `TAREAS_ACTIVAS` | `true` | `false` apaga la revisión diaria |
| `TAREAS_HORA` | `07:00` | Hora de la revisión diaria |
| `DUPLICADOS_DIAS` | `7` | Ventana de días de la regla de duplicados |
| `DUPLICADOS_TOLERANCIA` | `10` | Diferencia de cantidad permitida (%) |
| `DUPLICADOS_VENTANA` | `30` | Días hacia atrás que mira la revisión diaria |

## Endpoints nuevos

Todos exigen `Authorization: Bearer <token>`.

| Método y ruta | Qué hace |
|---|---|
| `GET /api/productos/:id/stock` | Stock total y por bodega, SS, PR, estado, días de cobertura y cantidad sugerida |
| `GET /api/productos/:id/trazabilidad?bodega_id=` | Historial cronológico con el saldo después de cada movimiento, la OC, el proveedor y el precio de cada entrada, y el avance de cada OC (pedida / recibida / pendiente) |
| `GET /api/movimientos?producto_id=&bodega_id=&tipo=&orden_id=&desde=&hasta=` | Lista de movimientos |
| `GET /api/movimientos/:id` | Un movimiento |
| `POST /api/movimientos` | Registra un movimiento. Devuelve el movimiento, el estado de reorden y la alerta (si cambió) |
| `POST /api/recepciones` con `lineas` | Registra la recepción y una entrada por material, ligada a la OC |
| `GET /api/alertas/reorden?incluir_ok=true` | Materiales por reponer **hoy**, ordenados por prioridad |
| `GET /api/alertas?estado=abierta` | Historial de la tabla de alertas |
| `GET /api/ordenes/posibles-duplicados?dias=&tolerancia=&desde=&hasta=` | Órdenes sospechosas con el motivo y el monto en riesgo |
| `POST /api/tareas/revision-diaria` · `GET` | Ejecuta la revisión diaria ahora · muestra el resultado de la última |

### Ejemplos

```http
POST /api/movimientos
{ "tipo": "salida", "producto_id": 4, "cantidad": 3, "bodega_origen_id": 2, "documento_numero": "VS-0201" }
```
Respuesta (resumida): la arena baja a 11 m³ y la alerta se escala a urgente.
```json
{ "stock": { "stock": 11, "punto_reorden": 20, "estado": "urgente", "cantidad_sugerida": 29 },
  "alerta": { "accion": "escalada", "prioridad": "urgente", "estado": "abierta" } }
```

```http
POST /api/recepciones
{ "orden_id": 2, "bodega_id": 1, "empleado_id": 5, "fecha": "2026-11-09",
  "lineas": [{ "producto_id": 1, "cantidad": 150 }] }
```

## Matriz de aprobación dentro del sistema (ejercicio A1, puntos extra)

Una orden queda **pendiente hasta que la apruebe el rol correcto**, según la matriz del enunciado:

| Monto evaluado | Aprueba | Cotizaciones vigentes |
|---|---|---|
| hasta ₡250 000 | Jefatura del área solicitante (solo su departamento) | 1 |
| ₡250 001 a ₡2 000 000 | Jefatura de Compras | 2 |
| ₡2 000 001 a ₡10 000 000 | Gerencia Financiera | 3 |
| más de ₡10 000 000 | Gerencia General | 3 + número de acta del comité |

Mejoras sobre la matriz propuesta (respuesta al riesgo de **fraccionamiento**):
- **Monto evaluado:** es el total de la orden **más** las demás órdenes no anuladas del mismo departamento y proveedor dentro de 30 días (`APROBACION_VENTANA_DIAS`). Dividir una compra en varias pequeñas no la deja bajo el umbral. Ejemplo del seed: la OC-1070 (₡1 260 000) sola la aprobaría Compras, pero suma con la OC-1061 (₡1 890 000) y sube a Gerencia Financiera.
- **Cotizaciones:** cada producto de la orden necesita cotizaciones de proveedores **distintos**, vigentes en la fecha de la orden.
- **Roles protegidos:** el rol y el departamento de cada usuario solo los asigna la Gerencia General, nadie puede cambiar su propio rol, y una cuenta nueva entra como *solicitante*, que no aprueba nada.
- **Registro de la aprobación:** cada orden guarda quién la aprobó, cuándo, con qué monto evaluado y nivel, y el acta del comité si aplica.

Respuestas de la API: **403** si el rol no alcanza y **409** si faltan cotizaciones o el acta. `GET /api/ordenes/:id/aprobacion` dice qué pide la matriz para una orden y si el usuario actual puede aprobarla. En la pantalla de Órdenes se muestra como un panel con cada requisito marcado, y el botón "Aprobar" se desactiva si algo no se cumple.

Cuentas de prueba (contraseña `Compras2026!`):

| Correo | Rol |
|---|---|
| `admin@empresa.co.cr` | Gerencia General |
| `finanzas@empresa.co.cr` | Gerencia Financiera |
| `compras@empresa.co.cr` | Jefatura de Compras |
| `mantenimiento@empresa.co.cr` | Jefatura del área (Mantenimiento) |

Para la demo:
- La **OC-1072** (₡58 000, Mantenimiento) la puede aprobar `mantenimiento@`.
- La **OC-1070** muestra el fraccionamiento: `compras@` no la puede aprobar, y `finanzas@` tampoco hasta registrar 2 cotizaciones más de cemento.

## Pantallas (React)

| Pantalla | Menú | Qué muestra |
|---|---|---|
| Alertas de reorden | Inventario | Qué pedir hoy por prioridad, una barra con el stock frente al punto de reorden, la cantidad sugerida y el historial de alertas. Tiene un botón para ejecutar la revisión diaria. |
| Movimientos | Inventario | Lista filtrable por tipo, material y bodega. El formulario cambia según el tipo, muestra el stock actual por bodega y avisa si se abrió o escaló una alerta. |
| Trazabilidad | Inventario | Stock, punto de reorden, entradas por orden de compra (pedida / recibida / pendiente) e historial con el saldo. Se abre desde cualquier material con `#/trazabilidad?producto=ID`. |
| Posibles duplicados | Compras | Tarjetas que comparan cada par de órdenes sospechosas, con el monto en riesgo. Los días y la tolerancia de la regla se pueden ajustar. |
| Recepciones | Compras | Al elegir la orden muestra lo pedido, lo ya recibido y lo pendiente. Lo recibido entra al inventario. |
| Productos | Catálogos | Demanda, tiempo de entrega, stock de seguridad y punto de reorden calculados, con una vista previa en el formulario. |
| Existencias | Inventario | Solo lectura de la cantidad; solo se edita el mínimo de cada bodega. |

## Cómo correrlo

```bash
cd backend
npm install
npm run seed     # recrea las tablas con los datos de Constructora Del Valle (conserva las cuentas)
npm run dev      # API en http://localhost:3000/api
npm test         # pruebas: reglas de inventario (sin base de datos) + asistente (con MySQL)
```

Usuario de prueba: `admin@empresa.co.cr` / `Compras2026!`

## Pruebas

`backend/test/inventario.test.js` tiene 25 pruebas de las reglas de negocio con los datos del enunciado y casos límite; `backend/test/aprobacion.test.js` suma 12 de la matriz de aprobación. La colección de Postman tiene la carpeta **Inventario** (19 peticiones) y las pruebas de la matriz en Órdenes y Usuarios: 233 peticiones y 550 aserciones sin fallos.
- **A5:** SS y PR de los cuatro materiales; qué reponer hoy y en qué orden; el caso de estar justo en el punto de reorden; urgente; sin parámetros; demanda 0.
- **A3:** detecta los dos duplicados. Con tolerancia 0 % solo queda el exacto. No marca órdenes con distinto proveedor ni con cantidades muy distintas.
- **Forma de los movimientos:** casos válidos e inválidos de cada tipo.
- **Revisión diaria:** el cálculo de la próxima ejecución.

## Demo sugerida (video de 5 minutos)

1. `GET /api/alertas/reorden`: muestra que block, arena y tubo PVC están por reponer, y en qué orden.
2. `GET /api/ordenes/posibles-duplicados`: detecta OC-1041 / OC-1042.
3. `POST /api/movimientos` con una salida de 3 m³ de arena: la alerta pasa a **urgente** y llega el aviso al canal de Slack o Discord.
4. `GET /api/productos/1/trazabilidad`: de qué OC y proveedor vino cada saco de cemento, y a qué precio.
5. `POST /api/tareas/revision-diaria`: el resumen que llega cada mañana.
