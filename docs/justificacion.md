# Justificación del sistema

## El problema

En muchas empresas las compras se solicitan por correo electrónico, mensajería o en hojas de cálculo que circulan entre áreas. Esa dispersión provoca que nadie tenga una vista confiable de **cuánto gasta cada departamento**, **qué pedidos siguen pendientes**, **qué se le debe a cada proveedor** y **qué hay en bodega**. Los pedidos se duplican, se pierden aprobaciones, se pagan facturas dos veces y el cierre contable depende de reconstruir información a mano.

## La solución

Órdenes de Compra centraliza el ciclo completo de compra en un único sistema:

1. **Requisición:** un empleado solicita lo que necesita su departamento.
2. **Cotización:** compras compara los precios que ofrecen los proveedores.
3. **Orden de compra:** se emite y se aprueba la compra (pendiente → aprobada → recibida, o anulada).
4. **Recepción:** la mercancía llega a una bodega y queda registrado quién la recibió.
5. **Factura y pago:** se registra la factura del proveedor y sus pagos hasta saldarla.

## A quién le sirve

- **Departamentos solicitantes:** registran sus requisiciones y consultan el avance de sus pedidos.
- **Área de compras:** administra proveedores, contactos, cotizaciones, productos y órdenes.
- **Bodega:** registra las recepciones y controla las existencias frente al mínimo de cada producto.
- **Finanzas y gerencia:** controlan el gasto por centro de costo, las cuentas por pagar y los pagos.

## Entidades y por qué existen

| Área | Entidad | Propósito |
|---|---|---|
| Organización | **Departamento** | Unidad que solicita la compra. Su centro de costo y presupuesto permiten medir el gasto por área. |
| Organización | **Empleado** | Persona de un departamento que solicita compras y recibe mercancía. La cédula única evita duplicados. |
| Catálogos | **Proveedor** | Empresa a la que se compra. La cédula jurídica única evita registros duplicados y el campo `activo` permite retirar a un proveedor sin perder su historial. |
| Catálogos | **Contacto de proveedor** | Personas con las que se trata en cada proveedor; cada proveedor tiene un solo contacto principal. |
| Catálogos | **Categoría** | Agrupa los productos (papelería, tecnología, ferretería, limpieza) para ordenar el catálogo. |
| Catálogos | **Producto** | Bienes que se compran, con unidad de medida y precio de referencia para estimar costos. |
| Compras | **Requisición** | Solicitud interna previa a la orden, con prioridad, monto estimado y aprobación. |
| Compras | **Cotización** | Precio que ofrece un proveedor por un producto, con su vigencia; permite elegir la mejor oferta. |
| Compras | **OrdenCompra** | Documento central: une un departamento con un proveedor, tiene un número único, una fecha, un estado y el total. |
| Compras | **DetalleOrden** | Cada línea de la orden: qué producto, cuántas unidades y a qué precio. |
| Compras | **Recepción** | Registro de la mercancía que llega a una bodega por una orden aprobada. |
| Inventario | **Bodega** | Lugar donde se almacena la mercancía, con un empleado responsable. |
| Inventario | **Existencia** | Cantidad de cada producto en cada bodega y su mínimo de reposición. |
| Cuentas por pagar | **Factura** | Cobro del proveedor por una orden; lo facturado no puede superar el total de la orden. |
| Cuentas por pagar | **Pago** | Abono a una factura; al cubrir el monto la factura pasa a pagada automáticamente. |
| Cuentas por pagar | **Método de pago** | Forma de pago (transferencia, SINPE Móvil, tarjeta corporativa). |

Las relaciones protegen la integridad de la información: no se puede eliminar un registro que otro todavía usa (se conserva la trazabilidad), mientras que los datos que dependen por completo de su padre, como las líneas de una orden o los contactos de un proveedor, se eliminan con él.
