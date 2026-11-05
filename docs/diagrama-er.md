# Diagrama entidad-relación

```mermaid
erDiagram
    DEPARTAMENTOS ||--o{ ORDENES_COMPRA : "solicita"
    PROVEEDORES   ||--o{ ORDENES_COMPRA : "atiende"
    ORDENES_COMPRA ||--|{ DETALLES_ORDEN : "contiene"
    PRODUCTOS     ||--o{ DETALLES_ORDEN : "se pide en"

    DEPARTAMENTOS {
        INT id PK
        VARCHAR(100) nombre "NOT NULL"
        VARCHAR(20) centro_costo "NOT NULL"
        DECIMAL(12_2) presupuesto
        DATETIME created_at
        DATETIME updated_at
    }

    PROVEEDORES {
        INT id PK
        VARCHAR(150) razon_social "NOT NULL"
        VARCHAR(20) rif UK "NOT NULL"
        VARCHAR(120) email "NOT NULL, formato email"
        VARCHAR(30) telefono
        BOOLEAN activo "DEFAULT true"
        DATETIME created_at
        DATETIME updated_at
    }

    PRODUCTOS {
        INT id PK
        VARCHAR(30) codigo UK "NOT NULL"
        VARCHAR(150) nombre "NOT NULL"
        VARCHAR(20) unidad "NOT NULL"
        DECIMAL(12_2) precio_ref ">= 0"
        DATETIME created_at
        DATETIME updated_at
    }

    ORDENES_COMPRA {
        INT id PK
        VARCHAR(30) numero UK "NOT NULL"
        DATE fecha "NOT NULL"
        ENUM estado "pendiente | aprobada | recibida | anulada"
        DECIMAL(12_2) total "DEFAULT 0"
        INT departamento_id FK "ON DELETE RESTRICT"
        INT proveedor_id FK "ON DELETE RESTRICT"
        DATETIME created_at
        DATETIME updated_at
    }

    DETALLES_ORDEN {
        INT id PK
        INT cantidad "NOT NULL, > 0"
        DECIMAL(12_2) precio_unitario "NOT NULL, >= 0"
        DECIMAL(12_2) subtotal "cantidad x precio_unitario"
        INT orden_id FK "ON DELETE CASCADE"
        INT producto_id FK "ON DELETE RESTRICT"
        DATETIME created_at
        DATETIME updated_at
    }
```

## Reglas de las relaciones

| Relación | Cardinalidad | Al eliminar el padre |
|---|---|---|
| Departamento → OrdenCompra | 1 : N | RESTRICT: no se elimina un departamento con órdenes |
| Proveedor → OrdenCompra | 1 : N | RESTRICT: no se elimina un proveedor con órdenes |
| OrdenCompra → DetalleOrden | 1 : N | CASCADE: se eliminan sus líneas de detalle |
| Producto → DetalleOrden | 1 : N | RESTRICT: no se elimina un producto usado en órdenes |

> En el diagrama `DECIMAL(12_2)` representa `DECIMAL(12,2)`; Mermaid no admite comas dentro del tipo.
