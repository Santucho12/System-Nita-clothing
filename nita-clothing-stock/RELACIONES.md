# Análisis de Relaciones del Sistema — Nita Clothing

Este documento detalla cómo se conectan las diferentes partes del sistema y qué sucede automáticamente cuando realizas acciones clave.

---

## 1. El Flujo de una Venta (Registrar Venta)

Cuando registras una venta, ocurre una "reacción en cadena" en el sistema:

1.  **Venta Principal (`sales`)**: Se crea un registro con un número único (ej: `V-000001`), el total, el método de pago y el cliente.
2.  **Detalles de Venta (`sale_items`)**: Se guarda exactamente qué productos se vendieron, a qué precio y cuánto talle/color tenían en ese momento.
3.  **Impacto en Stock (`productos`)**: 
    *   **Descuento**: La cantidad vendida se resta automáticamente del stock actual.
    *   **Estado**: Si el stock llega a 0, el producto puede marcarse como "sin stock".
4.  **Gestión de Clientes (`clientes`)**:
    *   Si usas un email, el sistema busca si ya existe.
    *   Si no existe, **crea al cliente automáticamente** con los datos de la venta.
    *   Actualiza la fecha de la "última compra" del cliente y su segmentación (ej: de "nuevo" a "activo").
5.  **Auditoría (`activity_log`)**: Se guarda un registro de quién hizo la venta y cuándo.

---

## 2. Abastecimiento y Compras (Órdenes de Compra)

Las órdenes de compra son la forma en que el stock "vuelve a llenarse":

1.  **Orden de Compra (`purchase_orders`)**: Se crea vinculada a un **Proveedor**.
2.  **Recepción de Mercadería**: Al marcar la orden como "Recibida":
    *   **Aumento de Stock**: Los productos de la orden suman sus cantidades al stock actual.
    *   **Actualización de Costo**: El sistema actualiza el costo del producto con el precio de compra más reciente.
3.  **Historial de Proveedor**: El sistema registra cuánto le has comprado a cada empresa/persona.

---

## 3. Catálogo de Ropa (Productos y Categorías)

*   **Categorías**: Cada producto **debe** pertenecer a una categoría (Remeras, Pantalones, etc.). Esto permite filtrar en el stock y en las estadísticas.
*   **Variantes (Talles y Colores)**: Aunque cada fila es un producto, el sistema permite manejar talles y colores que se guardan en el historial de ventas para saber qué es lo que más se vende.
*   **Proveedores**: Cada producto tiene un "Proveedor Predeterminado", lo que facilita generar órdenes de compra rápidas cuando el stock está bajo.

---

## 4. Estadísticas y Reportes

Todo lo anterior se une en el Dashboard y la sección de Estadísticas:

*   **Ventas vs. Costos**: Al guardar el costo del producto al momento de la venta, el sistema calcula tu **ganancia real** neta.
*   **Rendimiento de Productos**: El sistema sabe qué productos son "Best Sellers" basándose en el historial de `sale_items`.
*   **Alertas de Stock**: El sistema compara el `stock_actual` con el `stock_minimo` definido en cada producto para avisarte qué falta comprar.

---

## 5. Resumen de Entidades Técnicas

| Entidad | Se relaciona con... | ¿Por qué? |
| :--- | :--- | :--- |
| **Venta** | Cliente, Productos | Para saber quién compró y qué se llevó. |
| **Producto** | Categoría, Proveedor | Para organizar el stock y saber a quién comprarle. |
| **Orden de Compra** | Proveedor, Productos | Para reponer stock y actualizar costos. |
| **Promociones** | Productos o Categorías | Para aplicar descuentos automáticos en ventas. |
| **Logs** | Usuarios | Para saber qué cambios hizo cada empleado/admin. |

---
*Este análisis refleja el estado actual del sistema tras las correcciones de integridad de datos.*
