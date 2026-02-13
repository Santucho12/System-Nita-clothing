n# 🔗 RELACIONES DEL SISTEMA NITA CLOTHING

## 📋 ÍNDICE
1. [Entidades del Sistema](#entidades-del-sistema)
2. [Diagrama de Relaciones](#diagrama-de-relaciones)
3. [Flujos de Datos](#flujos-de-datos)
4. [Problemas Actuales](#problemas-actuales)
5. [Soluciones Propuestas](#soluciones-propuestas)
6. [Implementación Paso a Paso](#implementación-paso-a-paso)

---

## 🗂️ ENTIDADES DEL SISTEMA

### 1. **CATEGORÍAS** (`categories`)
**Tabla MySQL:** `categorias`
```sql
CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

**Campos:**
- `id`: Identificador único
- `nombre`: Nombre de la categoría (ej: "Remeras", "Pantalones", "Vestidos")
- `descripcion`: Descripción opcional
- `created_at`: Fecha de creación
- `updated_at`: Fecha de última actualización

**Dónde se gestiona:** Gestión de Stock (tiene botón "+" para crear categorías)

**Relaciones:**
- ✅ **1:N con PRODUCTOS** → Una categoría tiene muchos productos
- ✅ **Se usa en ESTADÍSTICAS** → Para reportes por categoría

---

### 2. **PROVEEDORES** (`suppliers`)
**Tabla MySQL:** `proveedores` (aunque el código usa `suppliers`)
```sql
CREATE TABLE suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    website VARCHAR(255),
    tax_id VARCHAR(100),
    payment_terms TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

**Campos:**
- `id`: Identificador único
- `name`: Nombre del proveedor
- `contact_name`: Nombre del contacto
- `email`: Email del proveedor
- `phone`: Teléfono
- `address`: Dirección
- `website`: Sitio web
- `tax_id`: CUIT/RUC/Tax ID
- `payment_terms`: Términos de pago
- `notes`: Notas adicionales

**Dónde se gestiona:** Sección "Proveedores"

**Relaciones:**
- ✅ **1:N con PRODUCTOS** → Un proveedor puede proveer muchos productos
- ❌ **NO tiene órdenes de compra** (no implementado)

---

### 3. **PRODUCTOS** (`products`)
**Tabla MySQL:** `productos`
```sql
CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    codigo VARCHAR(100) UNIQUE, -- SKU
    categoria_id INT,
    precio DECIMAL(10,2) NOT NULL DEFAULT 0,
    costo DECIMAL(10,2) DEFAULT 0,
    stock INT NOT NULL DEFAULT 0,
    stock_minimo INT DEFAULT 0,
    tallas VARCHAR(255),
    colores VARCHAR(255),
    proveedor INT, -- Foreign Key a suppliers
    ubicacion VARCHAR(255),
    estado ENUM('activo', 'inactivo', 'descontinuado') DEFAULT 'activo',
    fecha_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP,
    imagen_url TEXT,
    notas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
    FOREIGN KEY (proveedor) REFERENCES suppliers(id) ON DELETE SET NULL
)
```

**Campos clave:**
- `codigo`: SKU único del producto (usado en búsqueda)
- `categoria_id`: **OBLIGATORIO** → Todo producto pertenece a una categoría
- `proveedor`: ID del proveedor (puede ser NULL)
- `precio`: Precio de venta
- `costo`: Precio de compra/costo
- `stock`: Cantidad disponible **← SE DESCUENTA AL VENDER**
- `stock_minimo`: Alerta de reposición

**Dónde se gestiona:** Gestión de Stock

**Relaciones:**
- ✅ **N:1 con CATEGORÍAS** → Cada producto pertenece a UNA categoría
- ✅ **N:1 con PROVEEDORES** → Cada producto puede tener UN proveedor
- ✅ **1:N con SALE_ITEMS** → Un producto puede estar en muchas ventas
- ✅ **Afecta ESTADÍSTICAS** → Se calculan productos más vendidos, rotación

---

### 4. **VENTAS** (`sales`)
**Tabla MySQL:** `sales`
```sql
CREATE TABLE sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    payment_method ENUM('efectivo', 'tarjeta', 'transferencia', 'otro') DEFAULT 'efectivo',
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_type ENUM('percentage', 'amount') DEFAULT 'amount',
    discount_value DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_cost DECIMAL(10,2) DEFAULT 0,
    total_profit DECIMAL(10,2) DEFAULT 0,
    status ENUM('completed', 'pending', 'cancelled') DEFAULT 'completed',
    notes TEXT,
    user_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_email) REFERENCES customers(email) ON DELETE SET NULL,
    INDEX idx_created_at (created_at),
    INDEX idx_customer_email (customer_email),
    INDEX idx_status (status)
)
```

**Campos clave:**
- `customer_email`: Email del cliente **← CLAVE PARA VINCULAR CON CLIENTES**
- `subtotal`: Suma de todos los items
- `discount_amount`: Descuento aplicado
- `total`: Total final de la venta
- `total_profit`: Ganancia total (precio - costo) * cantidad
- `status`: Estado (completed, pending, cancelled)

**Dónde se gestiona:** "Registrar Venta" → crea registros aquí

**Relaciones:**
- ✅ **1:N con SALE_ITEMS** → Una venta tiene muchos items
- ✅ **N:1 con CUSTOMERS** → Cada venta referencia un cliente (customer_email → customers.email)
- ✅ **Se usa en HISTORIAL DE VENTAS**
- ✅ **Se usa en ESTADÍSTICAS**

---

### 5. **ITEMS DE VENTA** (`sale_items`)
**Tabla MySQL:** `sale_items`
```sql
CREATE TABLE sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    product_code VARCHAR(100),
    size VARCHAR(50),
    color VARCHAR(50),
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    profit DECIMAL(10,2) DEFAULT 0, -- (unit_price - unit_cost) * quantity
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES productos(id) ON DELETE RESTRICT,
    INDEX idx_sale_id (sale_id),
    INDEX idx_product_id (product_id)
)
```

**Campos clave:**
- `sale_id`: Venta a la que pertenece
- `product_id`: Producto vendido
- `quantity`: Cantidad vendida **← ESTA CANTIDAD SE DESCUENTA DEL STOCK**
- `unit_price`: Precio al que se vendió
- `unit_cost`: Costo del producto (para calcular ganancia)
- `profit`: Ganancia individual del item

**Dónde se crea:** Automáticamente al registrar una venta

**Relaciones:**
- ✅ **N:1 con SALES** → Muchos items pertenecen a una venta
- ✅ **N:1 con PRODUCTOS** → Cada item referencia un producto
- ✅ **Se usa en ESTADÍSTICAS** → Para productos más vendidos

---

### 6. **CLIENTES** (`customers`)
**Tabla MySQL:** `customers`
```sql
CREATE TABLE customers (
    email VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    notes TEXT,
    segment ENUM('frequent', 'occasional', 'new', 'inactive') DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_segment (segment),
    INDEX idx_name (name)
)
```

**Campos clave:**
- `email`: **Clave primaria** (usado para vincular con ventas)
- `name`: Nombre completo
- `segment`: Segmentación automática (frecuente/ocasional/nuevo/inactivo)
- `phone`, `address`, `city`, `state`: Datos de contacto

**Dónde se gestiona:** Sección "Clientes"

**⚠️ PROBLEMA ACTUAL:**
- Los clientes se crean **MANUALMENTE**
- Al registrar una venta, solo se guarda el `customer_email` en la tabla `sales`
- **NO se crea/actualiza automáticamente** el cliente en `customers`

**Relaciones:**
- ⚠️ **DEBERÍA tener 1:N con SALES** → Un cliente tiene muchas ventas
- ✅ Tiene método `getPurchaseHistory(email)` para buscar ventas
- ✅ Tiene método `getSegmentation()` para clasificar clientes

---

## 📊 DIAGRAMA DE RELACIONES

```
┌──────────────────┐
│   CATEGORÍAS     │
│  (categorias)    │
│                  │
│ - id (PK)        │
│ - nombre         │
│ - descripcion    │
└────────┬─────────┘
         │
         │ 1:N
         │
         ▼
┌──────────────────┐         ┌──────────────────┐
│   PROVEEDORES    │         │    PRODUCTOS     │
│  (suppliers)     │         │   (productos)    │
│                  │         │                  │
│ - id (PK)        │ 1:N     │ - id (PK)        │
│ - name           ├────────>│ - categoria_id (FK)
│ - contact_name   │         │ - proveedor (FK) │
│ - email          │         │ - nombre         │
│ - phone          │         │ - codigo (SKU)   │
└──────────────────┘         │ - precio         │
                             │ - costo          │
                             │ - stock ◄─────┐  │
                             └────────┬──────┴──┘
                                      │           │
                                      │ 1:N       │
                                      │           │ DESCUENTA
                                      ▼           │ STOCK
                             ┌────────────────┐  │
                             │  SALE_ITEMS    │  │
                             │ (sale_items)   │  │
                             │                │  │
                             │ - id (PK)      │  │
                             │ - sale_id (FK) │  │
                             │ - product_id (FK)─┘
                             │ - quantity     │
                             │ - unit_price   │
                             │ - profit       │
                             └───────┬────────┘
                                     │
                                     │ N:1
                                     │
                                     ▼
                             ┌────────────────┐
                             │     VENTAS     │
                             │    (sales)     │
                             │                │
                             │ - id (PK)      │

                             │     VENTAS     │
                             │    (sales)     │
                             │                │
                             │ - id (PK)      │
                             │ - customer_email ◄────────────┐
                             │ - payment_method   │           │
                             │ - total            │           │
                             │ - total_profit     │           │
                             │ - status           │           │
                             └────────────────────┘           │
                                                               │ N:1
                                                               │
                                                               ▼
                             ┌────────────────────┐
                             │     CLIENTES       │
                             │   (customers)      │
                             │                    │
                             │ - email (PK)       │
                             │ - name             │
                             │ - phone            │
                             │ - segment          │
                             └────────────────────┘


FLUJOS DE LECTURA PARA DASHBOARDS:

┌─────────────────────────────────────────┐
│           INICIO (Dashboard)            │
│                                         │
│  Lee:                                   │
│  - Total productos ◄── PRODUCTOS        │
│  - Capital en ropa ◄── CATEGORÍAS       │
│  - Ventas del mes ◄── SALES             │
│  - Facturación ◄── SALES.total          │
│  - Top productos ◄── SALE_ITEMS         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         ESTADÍSTICAS                    │
│                                         │
│  Lee:                                   │
│  - SALES (ventas totales, ganancias)   │
│  - SALE_ITEMS (productos vendidos)     │
│  - PRODUCTOS (stock, costos)           │
│  - CATEGORÍAS (rotación por categoría) │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         HISTORIAL VENTAS                │
│                                         │
│  Lee:                                   │
│  - SALES (todas las ventas)            │
│  - SALE_ITEMS (productos de cada venta)│
│  - Filtros: fecha, email, método pago  │
└─────────────────────────────────────────┘
```

---

## 🔄 FLUJOS DE DATOS

### **FLUJO 1: Crear Categoría**

```
FRONTEND (Products.js)
  │
  │ Usuario presiona "+" en filtro de categorías
  │
  ▼
  Modal con formulario:
  - Nombre (requerido)
  - Descripción (opcional)
  │
  │ handleCategorySubmit()
  │
  ▼
BACKEND (categoryController.create)
  │
  ▼
INSERT INTO categorias (nombre, descripcion)
  │
  ▼
✅ Categoría creada
  │
  └──> Se recarga lista de categorías
```

---

### **FLUJO 2: Crear Producto**

```
FRONTEND (Products.js)
  │
  │ Usuario presiona "+ Nuevo Producto"
  │
  ▼
  Modal con formulario:
  - Nombre
  - Código (SKU)
  - Categoría ◄── SELECT de categorías existentes
  - Proveedor ◄── SELECT de proveedores existentes
  - Precio
  - Costo
  - Stock
  - Stock mínimo
  - Tallas, colores, etc.
  │
  │ handleSubmit()
  │
  ▼
BACKEND (productController.create)
  │
  ▼
INSERT INTO productos (
  nombre, codigo, categoria_id, proveedor,
  precio, costo, stock, stock_minimo, ...
)
  │
  ▼
✅ Producto creado
  │
  └──> Aparece en lista de productos
```

**Validaciones:**
- ✅ `categoria_id` debe existir
- ✅ `proveedor` debe existir (o NULL)
- ✅ `codigo` (SKU) debe ser único

---

### **FLUJO 3: Registrar Venta** ⭐ **MÁS IMPORTANTE**

```
FRONTEND (RegisterSale.js)
  │
  │ Usuario agrega productos:
  │   1. Por SKU → busca producto por código
  │   2. Por Categoría+Detalles → busca por atributos
  │
  ▼
  Carrito con productos:
  - Producto 1: sku, quantity, unit_price
  - Producto 2: sku, quantity, unit_price
  - ...
  │
  ▼
  Datos del cliente:
  - customer_email (requerido en frontend, opcional en backend)
  - payment_method
  - discount_percent
  - discount_amount
  │
  │ handleSubmit()
  │
  ▼
BACKEND (saleController.createSale)
  │
  ├─ 1. Validar items
  │    - Verificar que product_id existe
  │    - Verificar que quantity > 0
  │    - Verificar que unit_price > 0
  │
  ├─ 2. Calcular totales
  │    - subtotal = sum(unit_price * quantity)
  │    - total = subtotal - descuentos
  │
  ▼
BEGIN TRANSACTION
  │
  ├─ 3. Validar stock
  │    │
  │    ▼
  │    Para cada producto:
  │      SELECT stock FROM productos WHERE id = product_id
  │      IF stock < quantity → ❌ ERROR: Stock insuficiente
  │
  ├─ 4. Insertar venta principal
  │    │
  │    ▼
  │    INSERT INTO sales (
  │      customer_name,
  │      customer_email, ◄── ⚠️ SÓLO GUARDA EMAIL, NO CREA CLIENTE
  │      payment_method,
  │      subtotal,
  │      discount_amount,
  │      total,
  │      created_at
  │    )
  │    → sale_id
  │
  ├─ 5. Insertar items y actualizar stock
  │    │
  │    ▼
  │    Para cada producto:
  │      │
  │      ├─ SELECT * FROM productos WHERE id = product_id
  │      │  (para obtener costo y calcular profit)
  │      │
  │      ├─ INSERT INTO sale_items (
  │      │    sale_id,
  │      │    product_id,
  │      │    product_name,
  │      │    size, color,
  │      │    quantity,
  │      │    unit_price,
  │      │    unit_cost,
  │      │    subtotal,
  │      │    profit ◄── (unit_price - unit_cost) * quantity
  │      │  )
  │      │
  │      └─ UPDATE productos
  │         SET stock = stock - quantity ◄── ⭐ DESCUENTA STOCK
  │         WHERE id = product_id
  │
  ▼
COMMIT
  │
  ▼
✅ Venta registrada exitosamente
  │
  └──> EFECTOS AUTOMÁTICOS:
       ├─ Stock actualizado
       ├─ Historial de ventas actualizado
       ├─ Estadísticas se recalculan automáticamente
       └─ ⚠️ Cliente NO se crea/actualiza
```

**Código Backend (Sale.js → createWithItems):**
```javascript
// Línea 125-175 en backend/models/Sale.js
static async createWithItems(saleData, items) {
    // 1. Validar stock
    for (const item of items) {
        const product = await database.get(
            'SELECT id, name, quantity FROM products WHERE id = ?',
            [item.product_id]
        );
        if (!product) throw new Error(`Producto ${item.product_id} no existe`);
        if (product.quantity < item.quantity) {
            throw new Error(
                `Stock insuficiente para ${product.name}. ` +
                `Disponible: ${product.quantity}, Solicitado: ${item.quantity}`
            );
        }
    }

    // 2. BEGIN TRANSACTION
    await database.run('BEGIN TRANSACTION');

    try {
        // 3. Insertar venta
        const result = await database.run(`
            INSERT INTO sales (
                subtotal, discount_percent, discount_amount, total,
                customer_name, payment_method, sale_date, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [
            saleData.subtotal,
            saleData.discount_percent,
            saleData.discount_amount,
            saleData.total,
            saleData.customer_name,
            saleData.payment_method
        ]);

        const sale_id = result.lastID;

        // 4. Insertar items y descontar stock
        for (const item of items) {
            const product = await database.get(
                'SELECT * FROM products WHERE id = ?',
                [item.product_id]
            );

            const subtotal = parseFloat(item.unit_price) * parseInt(item.quantity);
            const profit = (parseFloat(item.unit_price) - parseFloat(product.cost_price)) * parseInt(item.quantity);

            // Insertar item
            await SaleItem.create({
                sale_id,
                product_id: item.product_id,
                product_name: product.name,
                product_size: product.size,
                product_color: product.color,
                quantity: item.quantity,
                unit_price: item.unit_price,
                unit_cost: product.cost_price,
                subtotal,
                profit
            });

            // ⭐ ACTUALIZAR STOCK
            await database.run(
                'UPDATE products SET quantity = quantity - ?, updated_at = datetime("now") WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        await database.run('COMMIT');
        return { id: sale_id, ...saleData, items };

    } catch (err) {
        await database.run('ROLLBACK');
        throw err;
    }
}
```

---

### **FLUJO 4: Consultar Estadísticas**

```
FRONTEND (AdvancedReports.js o Dashboard.js)
  │
  │ Solicita estadísticas:
  │ - Ventas del día/mes/año
  │ - Productos más vendidos
  │ - Ganancia neta
  │ - ROI
  │
  ▼
BACKEND (saleController, reportController)
  │
  ├─ Ventas del día:
  │    SELECT COUNT(*), SUM(total)
  │    FROM sales
  │    WHERE DATE(created_at) = CURDATE()
  │
  ├─ Productos más vendidos:
  │    SELECT product_id, product_name, SUM(quantity) as total_sold
  │    FROM sale_items
  │    GROUP BY product_id
  │    ORDER BY total_sold DESC
  │    LIMIT 10
  │
  ├─ Ganancia neta:
  │    SELECT SUM(total_profit)
  │    FROM sales
  │    WHERE YEAR(created_at) = YEAR(CURDATE())
  │    AND MONTH(created_at) = MONTH(CURDATE())
  │
  └─ ROI:
       SELECT 
         SUM(total_profit) as ganancia,
         SUM(total_cost) as inversion,
         (SUM(total_profit) / SUM(total_cost) * 100) as roi
       FROM sales
  │
  ▼
✅ Retorna estadísticas calculadas en tiempo real
```

---

## ⚠️ PROBLEMAS ACTUALES

### **PROBLEMA 1: Clientes no se crean automáticamente**

**Descripción:**
- Al registrar una venta, se guarda `customer_email` en la tabla `sales`
- La tabla `customers` existe pero NO se usa automáticamente
- Los clientes solo se crean manualmente en la sección "Clientes"

**Consecuencias:**
- No hay historial unificado de clientes
- No se puede segmentar clientes automáticamente
- No se pueden aplicar descuentos por fidelidad
- Los reportes de clientes están incompletos

**Ubicación del código:**
- ❌ `backend/controllers/saleController.js` → NO crea cliente
- ❌ `backend/models/Sale.js → createWithItems()` → NO crea cliente

---

### **PROBLEMA 2: Error en Historial de Ventas**

**Descripción:**
- El frontend muestra "Error al cargar ventas"
- Posiblemente por falta de endpoints o datos vacíos

**Ubicación:**
- `frontend/src/components/SalesHistory.js`

---

### **PROBLEMA 3: Falta vincular Categorías en Dashboard**

**Descripción:**
- El Dashboard muestra "Capital en Ropa" pero usa `totalCategories`
- Debería calcular el valor total del inventario: `SUM(precio * stock)`

**Ubicación:**
- `frontend/src/components/Dashboard.js` (línea 186)

---

## ✅ SOLUCIONES PROPUESTAS

### **SOLUCIÓN 1: Integrar creación automática de clientes**

**Objetivo:** Al registrar una venta con email, crear/actualizar automáticamente el cliente

**Implementación:**

#### **Backend: Modificar `createWithItems` en Sale.js**

```javascript
// backend/models/Sale.js
static async createWithItems(saleData, items, customerEmail = null) {
    try {
        // 1. Validar stock (igual que antes)
        // ...

        await database.run('BEGIN TRANSACTION');

        try {
            // 2. Crear/actualizar cliente SI hay email
            if (customerEmail) {
                const existingCustomer = await database.get(
                    'SELECT * FROM customers WHERE email = ?',
                    [customerEmail]
                );

                if (existingCustomer) {
                    // Actualizar fecha de última compra
                    await database.run(
                        'UPDATE customers SET updated_at = NOW() WHERE email = ?',
                        [customerEmail]
                    );
                } else {
                    // Crear nuevo cliente
                    await database.run(`
                        INSERT INTO customers (
                            email, name, segment, created_at, updated_at
                        ) VALUES (?, ?, 'new', NOW(), NOW())
                    `, [
                        customerEmail,
                        saleData.customer_name || 'Cliente'
                    ]);
                }

                // Actualizar segmentación
                await this.updateCustomerSegment(customerEmail);
            }

            // 3. Insertar venta (igual que antes)
            // ...

            // 4. Insertar items y actualizar stock (igual que antes)
            // ...

            await database.run('COMMIT');
            return { id: sale_id, ...saleData, items };

        } catch (err) {
            await database.run('ROLLBACK');
            throw err;
        }
    } catch (error) {
        throw new Error(`Error creando venta: ${error.message}`);
    }
}

// Método auxiliar para actualizar segmentación
static async updateCustomerSegment(email) {
    // Contar compras en últimos 90 días
    const result = await database.get(`
        SELECT COUNT(*) as purchase_count,
               MAX(created_at) as last_purchase
        FROM sales
        WHERE customer_email = ?
          AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
    `, [email]);

    let segment = 'new';
    if (result.purchase_count >= 5) {
        segment = 'frequent';
    } else if (result.purchase_count >= 2) {
        segment = 'occasional';
    } else if (result.last_purchase < DATE_SUB(NOW(), INTERVAL 90 DAY)) {
        segment = 'inactive';
    }

    await database.run(
        'UPDATE customers SET segment = ? WHERE email = ?',
        [segment, email]
    );
}
```

#### **Backend: Modificar controller para pasar email**

```javascript
// backend/controllers/saleController.js
static async createSale(req, res) {
    try {
        const { items, customer_name, customer_email, payment_method, discount_percent, discount_amount } = req.body;

        // Validaciones...

        const saleData = {
            subtotal,
            discount_percent: discount_percent || 0,
            discount_amount: discount_amount || 0,
            total,
            customer_name: customer_name || null,
            customer_email: customer_email || null, // ← Asegurar que se pasa
            payment_method: payment_method || 'efectivo',
        };

        // Pasar customer_email como tercer parámetro
        const newSale = await Sale.createWithItems(saleData, items, customer_email);

        res.status(201).json({
            success: true,
            message: 'Venta registrada exitosamente',
            data: newSale
        });
    } catch (error) {
        // ...
    }
}
```

#### **Frontend: Hacer email obligatorio**

```javascript
// frontend/src/components/RegisterSale.js
// Línea ~450
<input
    type="email"
    placeholder="cliente@ejemplo.com"
    value={customerEmail}
    onChange={e => setCustomerEmail(e.target.value)}
    required // ← Ya está
    className="form-input"
    style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
/>
```

---

### **SOLUCIÓN 2: Arreglar Historial de Ventas**

**Revisar:**
1. ¿El endpoint `/api/sales/history` existe y funciona?
2. ¿Hay ventas en la base de datos?
3. ¿El frontend maneja correctamente la respuesta?

**Verificar endpoint:**
```javascript
// backend/routes/sales.js
router.get('/history', saleController.getSalesHistory);
```

**Verificar frontend:**
```javascript
// frontend/src/components/SalesHistory.js
// Debe llamar a saleService.getHistory() correctamente
```

---

### **SOLUCIÓN 3: Calcular Capital en Ropa correctamente**

**Backend: Crear endpoint para valor del inventario**

```javascript
// backend/controllers/reportController.js
static async getInventoryValue(req, res) {
    try {
        const sql = `
            SELECT 
                SUM(precio * stock) as total_value,
                SUM(costo * stock) as total_cost,
                COUNT(*) as total_products,
                SUM(stock) as total_units
            FROM productos
            WHERE estado = 'activo'
        `;
        const result = await database.get(sql);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
```

**Frontend: Actualizar Dashboard**

```javascript
// frontend/src/components/Dashboard.js
const [inventoryValue, setInventoryValue] = useState(0);

const loadDashboardData = async () => {
    // ...
    const inventoryResponse = await reportsService.getInventoryValue();
    setInventoryValue(inventoryResponse.data.total_value || 0);
};

// En el render:
<h3>${inventoryValue.toFixed(2)}</h3>
<p>Capital en Ropa</p>
```

---

## 🚀 IMPLEMENTACIÓN PASO A PASO

### **FASE 1: Integración de Clientes (PRIORIDAD ALTA)**

#### **Paso 1.1: Modificar modelo Sale**
- ✏️ Editar: `backend/models/Sale.js`
- ➕ Agregar parámetro `customerEmail` a `createWithItems()`
- ➕ Agregar lógica de creación/actualización de cliente
- ➕ Agregar método `updateCustomerSegment()`

#### **Paso 1.2: Modificar controlador**
- ✏️ Editar: `backend/controllers/saleController.js`
- ✏️ Modificar `createSale()` para pasar `customer_email`

#### **Paso 1.3: Asegurar email en tabla sales**
- ✅ Verificar que el campo `customer_email` se guarda en `sales`

#### **Paso 1.4: Testing**
1. Registrar venta con email nuevo
2. Verificar que se crea en `customers`
3. Registrar otra venta con mismo email
4. Verificar que se actualiza segmentación
5. Ver en sección "Clientes" que aparece automáticamente

---

### **FASE 2: Arreglar Historial de Ventas (PRIORIDAD MEDIA)**

#### **Paso 2.1: Verificar endpoint backend**
- ✅ Verificar que `/api/sales/history` existe
- ✅ Probar con Postman/Insomnia

#### **Paso 2.2: Revisar frontend**
- ✏️ Editar: `frontend/src/components/SalesHistory.js`
- ✅ Verificar manejo de errores
- ✅ Verificar formato de datos esperado

#### **Paso 2.3: Testing**
1. Cargar historial de ventas
2. Aplicar filtros
3. Verificar paginación

---

### **FASE 3: Mejorar Dashboard (PRIORIDAD BAJA)**

#### **Paso 3.1: Crear endpoint de valor de inventario**
- ✏️ Editar: `backend/controllers/reportController.js`
- ➕ Agregar método `getInventoryValue()`
- ✏️ Editar: `backend/routes/reports.js`
- ➕ Agregar ruta `GET /api/reports/inventory-value`

#### **Paso 3.2: Actualizar Dashboard**
- ✏️ Editar: `frontend/src/components/Dashboard.js`
- ✏️ Cambiar "Capital en Ropa" para mostrar valor real

#### **Paso 3.3: Testing**
1. Ver Dashboard
2. Verificar que muestra valor correcto del inventario

---

### **FASE 4: Validaciones y Mejoras (PRIORIDAD BAJA)**

#### **Paso 4.1: Validar email en frontend**
- Mostrar sugerencias de emails existentes
- Autocompletar datos del cliente

#### **Paso 4.2: Agregar descuentos por fidelidad**
- Clientes "frecuentes" → 5% automático
- Clientes "ocasionales" → 2% automático

#### **Paso 4.3: Notificaciones**
- Email de bienvenida al crear cliente
- Email de confirmación de compra

---

## 📝 CHECKLIST DE IMPLEMENTACIÓN

- [ ] **FASE 1: Clientes automáticos**
  - [ ] Modificar `Sale.createWithItems()`
  - [ ] Agregar `updateCustomerSegment()`
  - [ ] Modificar `saleController.createSale()`
  - [ ] Testing completo
  
- [ ] **FASE 2: Historial de ventas**
  - [ ] Verificar endpoint
  - [ ] Arreglar frontend
  - [ ] Testing
  
- [ ] **FASE 3: Dashboard mejorado**
  - [ ] Crear endpoint inventario
  - [ ] Actualizar Dashboard
  - [ ] Testing
  
- [ ] **FASE 4: Validaciones**
  - [ ] Autocompletar emails
  - [ ] Descuentos automáticos
  - [ ] Notificaciones

---

## 📌 NOTAS FINALES

### **Prioridades Recomendadas:**
1. ⭐⭐⭐ **Integración de clientes** (crítico para CRM)
2. ⭐⭐ **Historial de ventas** (funcionalidad básica)
3. ⭐ **Dashboard mejorado** (cosmético)

### **Dependencias entre módulos:**
- `CATEGORÍAS` → fundamental para `PRODUCTOS`
- `PRODUCTOS` → fundamental para `VENTAS`
- `VENTAS` → fundamental para `ESTADÍSTICAS`
- `CLIENTES` → debería vincularse con `VENTAS`

### **Testing Recomendado:**
1. Crear categoría
2. Crear producto con esa categoría
3. Registrar venta con ese producto
4. Verificar que stock se descuenta
5. Verificar que cliente se crea
6. Ver estadísticas actualizadas
7. Ver historial de ventas

---

**Documento actualizado:** $(date)
**Sistema:** Nita Clothing Management System
**Stack:** MySQL + Node.js + React
