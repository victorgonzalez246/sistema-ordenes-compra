# Justificación del sistema

## El problema

En muchas empresas las compras se solicitan por correo electrónico, mensajería o en hojas de cálculo que circulan entre áreas. Esa dispersión provoca que nadie tenga una vista confiable de **cuánto gasta cada departamento**, **qué pedidos siguen pendientes** y **con qué proveedores se trabaja**. Los pedidos se duplican, se pierden aprobaciones y el cierre contable depende de reconstruir información a mano.

## La solución

Órdenes de Compra centraliza el ciclo de compra en un único sistema: cada orden queda registrada con su número, fecha, departamento solicitante, proveedor, líneas de detalle y un estado que refleja en qué punto del proceso se encuentra (pendiente, aprobada, recibida o anulada).

## A quién le sirve

- **Departamentos solicitantes:** registran sus necesidades y consultan el avance de sus pedidos.
- **Área de compras:** administra el catálogo de proveedores y productos y gestiona las órdenes.
- **Finanzas y gerencia:** controlan el gasto por centro de costo frente al presupuesto asignado.

## Entidades y por qué existen

| Entidad | Propósito |
|---|---|
| **Departamento** | Unidad que solicita la compra. Su centro de costo y presupuesto permiten medir el gasto por área. |
| **Proveedor** | Empresa a la que se compra. La cédula jurídica única evita registros duplicados y el campo `activo` permite retirar a un proveedor sin perder su historial. |
| **Producto** | Catálogo de bienes que se compran, con unidad de medida y precio de referencia para estimar costos. |
| **OrdenCompra** | Documento central: une un departamento con un proveedor, tiene un número único, una fecha, un estado y el total de la compra. |
| **DetalleOrden** | Cada línea de la orden: qué producto, cuántas unidades y a qué precio. Separarla de la orden permite que una compra incluya varios productos. |

Las relaciones protegen la integridad de la información: no se puede eliminar un departamento, proveedor o producto que ya forma parte de una orden (se conserva la trazabilidad), mientras que al anular y eliminar una orden sus líneas de detalle se eliminan con ella.
