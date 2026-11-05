-- ============================================================
-- Consultas SQL para MySQL Workbench / terminal mysql
-- Base de datos: ordenes_compra
-- ============================================================

USE ordenes_compra;

-- ************************************************************
-- VER DATOS (SELECT)
-- ************************************************************

-- Ver todos los departamentos
SELECT * FROM departamentos;

-- Ver todos los proveedores activos
SELECT * FROM proveedores WHERE activo = 1;

-- Ver todos los empleados con su departamento
SELECT e.id, e.cedula, e.nombre, e.puesto, e.email, e.telefono, e.activo,
       d.nombre AS departamento
FROM empleados e
JOIN departamentos d ON e.departamento_id = d.id;

-- Ver todas las categorías
SELECT * FROM categorias;

-- Ver productos con su categoría
SELECT p.id, p.codigo, p.nombre, p.unidad, p.precio_ref,
       c.nombre AS categoria
FROM productos p
LEFT JOIN categorias c ON p.categoria_id = c.id;

-- Ver órdenes de compra con proveedor y departamento
SELECT oc.id, oc.numero, oc.fecha, oc.estado, oc.total,
       p.razon_social AS proveedor,
       d.nombre AS departamento
FROM ordenes_compra oc
JOIN proveedores p ON oc.proveedor_id = p.id
JOIN departamentos d ON oc.departamento_id = d.id
ORDER BY oc.fecha DESC;

-- Ver detalles de una orden específica (cambiar el ID)
SELECT do2.id, pr.codigo, pr.nombre AS producto, do2.cantidad,
       do2.precio_unitario, do2.subtotal
FROM detalles_orden do2
JOIN productos pr ON do2.producto_id = pr.id
WHERE do2.orden_id = 1;

-- Ver requisiciones con el empleado que las hizo
SELECT r.id, r.numero, r.fecha, r.descripcion, r.prioridad,
       r.monto_estimado, r.estado,
       e.nombre AS solicitante
FROM requisiciones r
JOIN empleados e ON r.empleado_id = e.id;

-- Ver cotizaciones con proveedor y producto
SELECT cot.id, cot.fecha, cot.vigencia_hasta, cot.precio,
       cot.dias_entrega, cot.observaciones,
       p.razon_social AS proveedor,
       pr.nombre AS producto
FROM cotizaciones cot
JOIN proveedores p ON cot.proveedor_id = p.id
JOIN productos pr ON cot.producto_id = pr.id;

-- Ver bodegas con su responsable
SELECT b.id, b.nombre, b.ubicacion, b.activa,
       e.nombre AS responsable
FROM bodegas b
LEFT JOIN empleados e ON b.responsable_id = e.id;

-- Ver existencias (inventario) por bodega
SELECT ex.id, pr.codigo, pr.nombre AS producto,
       b.nombre AS bodega, ex.cantidad, ex.minimo,
       CASE WHEN ex.cantidad < ex.minimo THEN '⚠ BAJO' ELSE 'OK' END AS alerta
FROM existencias ex
JOIN productos pr ON ex.producto_id = pr.id
JOIN bodegas b ON ex.bodega_id = b.id;

-- Ver recepciones
SELECT rec.id, rec.fecha, rec.observaciones,
       oc.numero AS orden,
       b.nombre AS bodega,
       e.nombre AS recibido_por
FROM recepciones rec
JOIN ordenes_compra oc ON rec.orden_id = oc.id
JOIN bodegas b ON rec.bodega_id = b.id
JOIN empleados e ON rec.empleado_id = e.id;

-- Ver facturas con estado de pago
SELECT f.id, f.numero, f.fecha, f.fecha_vencimiento,
       f.monto, f.pagado, (f.monto - f.pagado) AS saldo_pendiente,
       f.estado, oc.numero AS orden
FROM facturas f
JOIN ordenes_compra oc ON f.orden_id = oc.id;

-- Ver pagos realizados
SELECT pa.id, pa.fecha, pa.monto, pa.referencia,
       f.numero AS factura,
       mp.nombre AS metodo_pago
FROM pagos pa
JOIN facturas f ON pa.factura_id = f.id
JOIN metodos_pago mp ON pa.metodo_pago_id = mp.id;

-- Ver métodos de pago
SELECT * FROM metodos_pago;

-- Ver usuarios (sin contraseña)
SELECT id, nombre, correo, fecha_creacion FROM usuarios;


-- ************************************************************
-- INSERTAR DATOS (INSERT)
-- ************************************************************

-- Insertar un departamento
INSERT INTO departamentos (nombre, centro_costo, presupuesto, created_at, updated_at)
VALUES ('Recursos Humanos', 'CC-400', 10000000, NOW(), NOW());

-- Insertar un proveedor
INSERT INTO proveedores (razon_social, cedula_juridica, email, telefono, activo, created_at, updated_at)
VALUES ('Papelera Nacional S.A.', '3-101-555555', 'ventas@papelera.co.cr', '+506 2233-4455', 1, NOW(), NOW());

-- Insertar un producto
INSERT INTO productos (codigo, nombre, unidad, precio_ref, categoria_id, created_at, updated_at)
VALUES ('PAP-010', 'Carpeta manila tamaño carta', 'paquete', 1500, 1, NOW(), NOW());

-- Insertar un empleado
INSERT INTO empleados (cedula, nombre, puesto, email, telefono, activo, departamento_id, created_at, updated_at)
VALUES ('5-0333-0444', 'Ana López Mora', 'Asistente de RRHH', 'alopez@empresa.co.cr', '+506 8899-1122', 1, 1, NOW(), NOW());


-- ************************************************************
-- ACTUALIZAR DATOS (UPDATE)
-- ************************************************************

-- Actualizar el presupuesto de un departamento
UPDATE departamentos
SET presupuesto = 50000000, updated_at = NOW()
WHERE id = 1;

-- Cambiar estado de una orden a 'aprobada'
UPDATE ordenes_compra
SET estado = 'aprobada', updated_at = NOW()
WHERE id = 3;

-- Desactivar un proveedor (en vez de eliminarlo)
UPDATE proveedores
SET activo = 0, updated_at = NOW()
WHERE id = 4;

-- Actualizar el precio de referencia de un producto
UPDATE productos
SET precio_ref = 3100, updated_at = NOW()
WHERE codigo = 'PAP-001';

-- Cambiar estado de una requisición a 'aprobada'
UPDATE requisiciones
SET estado = 'aprobada', updated_at = NOW()
WHERE id = 5;


-- ************************************************************
-- ELIMINAR DATOS (DELETE)
-- ************************************************************

-- ⚠ CUIDADO: las foreign keys protegen la integridad.
-- No puedes borrar un proveedor que tiene órdenes, por ejemplo.

-- Eliminar un método de pago (solo si no tiene pagos asociados)
DELETE FROM metodos_pago WHERE id = 4;

-- Eliminar una cotización
DELETE FROM cotizaciones WHERE id = 5;

-- Eliminar un contacto de proveedor
DELETE FROM contactos_proveedor WHERE id = 6;


-- ************************************************************
-- CONSULTAS ÚTILES (REPORTES)
-- ************************************************************

-- Total de compras por proveedor
SELECT p.razon_social, COUNT(oc.id) AS total_ordenes,
       SUM(oc.total) AS monto_total
FROM ordenes_compra oc
JOIN proveedores p ON oc.proveedor_id = p.id
GROUP BY p.id, p.razon_social
ORDER BY monto_total DESC;

-- Total de compras por departamento
SELECT d.nombre AS departamento, COUNT(oc.id) AS total_ordenes,
       SUM(oc.total) AS monto_total
FROM ordenes_compra oc
JOIN departamentos d ON oc.departamento_id = d.id
GROUP BY d.id, d.nombre;

-- Facturas pendientes de pago
SELECT f.numero, f.fecha_vencimiento, f.monto, f.pagado,
       (f.monto - f.pagado) AS saldo_pendiente,
       DATEDIFF(f.fecha_vencimiento, CURDATE()) AS dias_restantes
FROM facturas f
WHERE f.estado = 'pendiente'
ORDER BY f.fecha_vencimiento;

-- Productos con existencia bajo el mínimo
SELECT pr.codigo, pr.nombre, b.nombre AS bodega,
       ex.cantidad, ex.minimo, (ex.minimo - ex.cantidad) AS faltante
FROM existencias ex
JOIN productos pr ON ex.producto_id = pr.id
JOIN bodegas b ON ex.bodega_id = b.id
WHERE ex.cantidad < ex.minimo;

