# Órdenes de Compra

Sistema para centralizar las órdenes de compra de una empresa: departamentos solicitantes, proveedores, catálogo de productos y el estado de cada pedido.

- **API REST** en Node.js + Express, con MySQL y Sequelize.
- **Aplicación web** en React + Vite.

Actualmente la API expone la gestión completa de **Proveedores**. Las tablas de departamentos, productos, órdenes y detalles ya están modeladas y se crean al iniciar el servidor.

## Requisitos

- Node.js 18 o superior (probado con Node 24)
- MySQL 8.0
- Postman CLI (opcional, para ejecutar las pruebas automatizadas)

## Estructura

```
├── backend/            API REST (Express + Sequelize)
│   ├── src/
│   │   ├── config/       Conexión a la base de datos
│   │   ├── models/       Modelos y relaciones
│   │   ├── controllers/  Lógica de cada recurso
│   │   ├── routes/       Rutas, montadas bajo /api
│   │   ├── middlewares/  Validación, 404 y manejo de errores
│   │   ├── validators/   Reglas de express-validator
│   │   └── seeders/      Datos de ejemplo
│   └── server.js
├── frontend/           Aplicación React (Vite)
├── docs/               Justificación y diagrama ER
└── postman/            Colección de pruebas
```

## Puesta en marcha

### 1. Crear la base de datos

```sql
CREATE DATABASE ordenes_compra CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Las tablas no se crean a mano: el servidor las genera con `sequelize.sync()` al arrancar.

### 2. Configurar el back end

```bash
cd backend
cp .env.example .env      # en Windows: copy .env.example .env
```

Edita `backend/.env` con tus datos:

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto de la API | `3000` |
| `CORS_ORIGIN` | Origen permitido para el front | `http://localhost:5173` |
| `DB_HOST` | Servidor MySQL | `localhost` |
| `DB_PORT` | Puerto MySQL | `3306` |
| `DB_NAME` | Nombre de la base de datos | `ordenes_compra` |
| `DB_USER` | Usuario MySQL | `root` |
| `DB_PASSWORD` | Contraseña MySQL | |

### 3. Instalar dependencias y cargar datos de ejemplo

```bash
npm install
npm run seed
```

El seed **recrea las tablas** y carga 3 departamentos, 4 proveedores y 5 productos. No lo ejecutes sobre una base con datos que quieras conservar.

### 4. Levantar la API

```bash
npm run dev     # desarrollo, con recarga automática (nodemon)
npm start       # producción
```

La API queda disponible en `http://localhost:3000/api`.

### 5. Levantar el front end

```bash
cd ../frontend
npm install
npm run dev
```

Se abre en `http://localhost:5173`. La URL de la API se configura con `VITE_API_URL` (ver `frontend/.env.example`).

## API

### Proveedores

| Método | Ruta | Respuesta |
|---|---|---|
| `GET` | `/api/proveedores` | 200 con el listado |
| `GET` | `/api/proveedores/:id` | 200, o 404 si no existe |
| `POST` | `/api/proveedores` | 201 con el proveedor creado |
| `PUT` | `/api/proveedores/:id` | 200 con el proveedor actualizado |
| `DELETE` | `/api/proveedores/:id` | 204; 409 si tiene órdenes asociadas |

Cuerpo para crear:

```json
{
  "razon_social": "Suministros Ofimáticos del Centro, C.A.",
  "rif": "J-30512874-6",
  "email": "ventas@sofcentro.com",
  "telefono": "+58 212-555-0142",
  "activo": true
}
```

`razon_social`, `rif` y `email` son obligatorios; `telefono` y `activo` son opcionales. En `PUT` se envían solo los campos que cambian.

### Errores

Todas las respuestas de error tienen la misma forma:

```json
{
  "error": "Datos de entrada no válidos",
  "detalles": [
    { "campo": "email", "ubicacion": "body", "mensaje": "El email no tiene un formato válido" }
  ]
}
```

| Código | Cuándo |
|---|---|
| 400 | Faltan campos obligatorios, tipos incorrectos, email inválido, id no numérico o JSON mal formado |
| 404 | El registro o la ruta no existen |
| 409 | RIF duplicado, o se intenta eliminar un proveedor con órdenes |
| 500 | Error interno |

## Pruebas

La colección `postman/ordenes-compra.postman_collection.json` cubre el CRUD de proveedores y los casos de error (400, 404 y 409). Con la API levantada y el seed cargado:

```bash
postman collection run postman/ordenes-compra.postman_collection.json
```

También puede importarse en la aplicación de Postman. La variable `baseUrl` apunta a `http://localhost:3000/api`.

Resultado de la última ejecución (13 peticiones, 31 aserciones, 0 fallos):

![Resultado de las pruebas con Postman CLI](docs/evidencias/pruebas-postman.png)

La salida completa en texto está en [`docs/evidencias/pruebas-postman.txt`](docs/evidencias/pruebas-postman.txt).

## Documentación

- [Justificación del sistema](docs/justificacion.md)
- [Diagrama entidad-relación](docs/diagrama-er.md)
- [Justificación y modelo de datos (PDF)](docs/Ordenes_de_Compra_Justificacion_y_Modelo.pdf)
- [Evidencia de pruebas con Postman](docs/evidencias/pruebas-postman.png)
