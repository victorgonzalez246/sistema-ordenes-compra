-- ============================================================
-- Script SQL para MySQL
-- Sistema de Órdenes de Compra - mini-proyecto-1
-- Generado a partir de los modelos Sequelize del proyecto
--
-- No es obligatorio ejecutarlo: al arrancar, el servidor crea las tablas
-- y "npm run seed" las recrea con datos de ejemplo. Sirve como referencia
-- del esquema o para crear la base a mano. Las tablas se crean vacías.
-- ============================================================

-- Crear la base de datos (debe coincidir con DB_NAME en backend/.env)
CREATE DATABASE IF NOT EXISTS ordenes_compra
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ordenes_compra;

-- ============================================================
-- 1. USUARIOS (autenticación)
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id            INT            NOT NULL AUTO_INCREMENT,
  nombre        VARCHAR(100)   NOT NULL,
  correo        VARCHAR(120)   NOT NULL,
  password      VARCHAR(72)    NOT NULL,
  fecha_creacion DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_usuarios_correo UNIQUE (correo)
) ENGINE=InnoDB;

-- ============================================================
-- 2. DEPARTAMENTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS departamentos (
  id            INT            NOT NULL AUTO_INCREMENT,
  nombre        VARCHAR(100)   NOT NULL,
  centro_costo  VARCHAR(20)    NOT NULL,
  presupuesto   DECIMAL(12,2)  NULL,
  created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- ============================================================
-- 3. CATEGORÍAS
-- ============================================================
CREATE TABLE IF NOT EXISTS categorias (
  id            INT            NOT NULL AUTO_INCREMENT,
  nombre        VARCHAR(80)    NOT NULL,
  descripcion   VARCHAR(255)   NULL,
  created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_categorias_nombre UNIQUE (nombre)
) ENGINE=InnoDB;

-- ============================================================
-- 4. MÉTODOS DE PAGO
-- ============================================================
CREATE TABLE IF NOT EXISTS metodos_pago (
  id            INT            NOT NULL AUTO_INCREMENT,
  nombre        VARCHAR(60)    NOT NULL,
  descripcion   VARCHAR(255)   NULL,
  activo        TINYINT(1)     NOT NULL DEFAULT 1,
  created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_metodos_pago_nombre UNIQUE (nombre)
) ENGINE=InnoDB;

-- ============================================================
-- 5. PROVEEDORES
-- ============================================================
CREATE TABLE IF NOT EXISTS proveedores (
  id              INT            NOT NULL AUTO_INCREMENT,
  razon_social    VARCHAR(150)   NOT NULL,
  cedula_juridica VARCHAR(20)    NOT NULL,
  email           VARCHAR(120)   NOT NULL,
  telefono        VARCHAR(30)    NULL,
  activo          TINYINT(1)     NOT NULL DEFAULT 1,
  created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_proveedores_cedula_juridica UNIQUE (cedula_juridica)
) ENGINE=InnoDB;

-- ============================================================
-- 6. CONTACTOS DE PROVEEDOR
-- ============================================================
CREATE TABLE IF NOT EXISTS contactos_proveedor (
  id            INT            NOT NULL AUTO_INCREMENT,
  nombre        VARCHAR(120)   NOT NULL,
  puesto        VARCHAR(80)    NULL,
  email         VARCHAR(120)   NOT NULL,
  telefono      VARCHAR(30)    NULL,
  principal     TINYINT(1)     NOT NULL DEFAULT 0,
  proveedor_id  INT            NOT NULL,
  created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_contactos_proveedor_proveedor
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 7. EMPLEADOS
-- ============================================================
CREATE TABLE IF NOT EXISTS empleados (
  id              INT            NOT NULL AUTO_INCREMENT,
  cedula          VARCHAR(12)    NOT NULL,
  nombre          VARCHAR(120)   NOT NULL,
  puesto          VARCHAR(80)    NOT NULL,
  email           VARCHAR(120)   NOT NULL,
  telefono        VARCHAR(30)    NULL,
  activo          TINYINT(1)     NOT NULL DEFAULT 1,
  departamento_id INT            NOT NULL,
  created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_empleados_cedula UNIQUE (cedula),
  CONSTRAINT fk_empleados_departamento
    FOREIGN KEY (departamento_id) REFERENCES departamentos(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 8. PRODUCTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS productos (
  id            INT            NOT NULL AUTO_INCREMENT,
  codigo        VARCHAR(30)    NOT NULL,
  nombre        VARCHAR(150)   NOT NULL,
  unidad        VARCHAR(20)    NOT NULL,
  precio_ref    DECIMAL(12,2)  NULL,
  categoria_id  INT            NULL,
  created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_productos_codigo UNIQUE (codigo),
  CONSTRAINT fk_productos_categoria
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 9. BODEGAS
-- ============================================================
CREATE TABLE IF NOT EXISTS bodegas (
  id              INT            NOT NULL AUTO_INCREMENT,
  nombre          VARCHAR(80)    NOT NULL,
  ubicacion       VARCHAR(200)   NOT NULL,
  activa          TINYINT(1)     NOT NULL DEFAULT 1,
  responsable_id  INT            NULL,
  created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_bodegas_nombre UNIQUE (nombre),
  CONSTRAINT fk_bodegas_responsable
    FOREIGN KEY (responsable_id) REFERENCES empleados(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 10. EXISTENCIAS (inventario por producto-bodega)
-- ============================================================
CREATE TABLE IF NOT EXISTS existencias (
  id            INT            NOT NULL AUTO_INCREMENT,
  cantidad      INT            NOT NULL DEFAULT 0,
  minimo        INT            NOT NULL DEFAULT 0,
  producto_id   INT            NOT NULL,
  bodega_id     INT            NOT NULL,
  created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_existencias_producto_bodega UNIQUE (producto_id, bodega_id),
  CONSTRAINT fk_existencias_producto
    FOREIGN KEY (producto_id) REFERENCES productos(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_existencias_bodega
    FOREIGN KEY (bodega_id) REFERENCES bodegas(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 11. REQUISICIONES (solicitudes internas de compra)
-- ============================================================
CREATE TABLE IF NOT EXISTS requisiciones (
  id              INT            NOT NULL AUTO_INCREMENT,
  numero          VARCHAR(30)    NOT NULL,
  fecha           DATE           NOT NULL,
  descripcion     VARCHAR(255)   NOT NULL,
  prioridad       ENUM('baja','media','alta') NOT NULL DEFAULT 'media',
  monto_estimado  DECIMAL(12,2)  NULL,
  estado          ENUM('pendiente','aprobada','rechazada') NOT NULL DEFAULT 'pendiente',
  empleado_id     INT            NOT NULL,
  created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_requisiciones_numero UNIQUE (numero),
  CONSTRAINT fk_requisiciones_empleado
    FOREIGN KEY (empleado_id) REFERENCES empleados(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 12. COTIZACIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS cotizaciones (
  id              INT            NOT NULL AUTO_INCREMENT,
  fecha           DATE           NOT NULL,
  vigencia_hasta  DATE           NOT NULL,
  precio          DECIMAL(12,2)  NOT NULL,
  dias_entrega    INT            NULL,
  observaciones   VARCHAR(255)   NULL,
  proveedor_id    INT            NOT NULL,
  producto_id     INT            NOT NULL,
  created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_cotizaciones_proveedor
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cotizaciones_producto
    FOREIGN KEY (producto_id) REFERENCES productos(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 13. ÓRDENES DE COMPRA
-- ============================================================
CREATE TABLE IF NOT EXISTS ordenes_compra (
  id              INT            NOT NULL AUTO_INCREMENT,
  numero          VARCHAR(30)    NOT NULL,
  fecha           DATE           NOT NULL,
  estado          ENUM('pendiente','aprobada','recibida','anulada') NOT NULL DEFAULT 'pendiente',
  total           DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  departamento_id INT            NOT NULL,
  proveedor_id    INT            NOT NULL,
  created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_ordenes_compra_numero UNIQUE (numero),
  CONSTRAINT fk_ordenes_departamento
    FOREIGN KEY (departamento_id) REFERENCES departamentos(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_ordenes_proveedor
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 14. DETALLES DE ORDEN
-- ============================================================
CREATE TABLE IF NOT EXISTS detalles_orden (
  id              INT            NOT NULL AUTO_INCREMENT,
  cantidad        INT            NOT NULL,
  precio_unitario DECIMAL(12,2)  NOT NULL,
  subtotal        DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  orden_id        INT            NOT NULL,
  producto_id     INT            NOT NULL,
  created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_detalles_orden
    FOREIGN KEY (orden_id) REFERENCES ordenes_compra(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_detalles_producto
    FOREIGN KEY (producto_id) REFERENCES productos(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 15. RECEPCIONES DE MERCANCÍA
-- ============================================================
CREATE TABLE IF NOT EXISTS recepciones (
  id              INT            NOT NULL AUTO_INCREMENT,
  fecha           DATE           NOT NULL,
  observaciones   VARCHAR(255)   NULL,
  orden_id        INT            NOT NULL,
  bodega_id       INT            NOT NULL,
  empleado_id     INT            NOT NULL,
  created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_recepciones_orden
    FOREIGN KEY (orden_id) REFERENCES ordenes_compra(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_recepciones_bodega
    FOREIGN KEY (bodega_id) REFERENCES bodegas(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_recepciones_empleado
    FOREIGN KEY (empleado_id) REFERENCES empleados(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 16. FACTURAS
-- ============================================================
CREATE TABLE IF NOT EXISTS facturas (
  id                INT            NOT NULL AUTO_INCREMENT,
  numero            VARCHAR(30)    NOT NULL,
  fecha             DATE           NOT NULL,
  fecha_vencimiento DATE           NOT NULL,
  monto             DECIMAL(12,2)  NOT NULL,
  pagado            DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  estado            ENUM('pendiente','pagada','anulada') NOT NULL DEFAULT 'pendiente',
  orden_id          INT            NOT NULL,
  created_at        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_facturas_numero UNIQUE (numero),
  CONSTRAINT fk_facturas_orden
    FOREIGN KEY (orden_id) REFERENCES ordenes_compra(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 17. PAGOS
-- ============================================================
CREATE TABLE IF NOT EXISTS pagos (
  id              INT            NOT NULL AUTO_INCREMENT,
  fecha           DATE           NOT NULL,
  monto           DECIMAL(12,2)  NOT NULL,
  referencia      VARCHAR(60)    NULL,
  factura_id      INT            NOT NULL,
  metodo_pago_id  INT            NOT NULL,
  created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_pagos_factura
    FOREIGN KEY (factura_id) REFERENCES facturas(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_pagos_metodo_pago
    FOREIGN KEY (metodo_pago_id) REFERENCES metodos_pago(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

