# 🛍️ Nita Clothing - Sistema de Gestión de Stock

Sistema de gestión de inventario para tienda de ropa femenina desarrollado con Node.js, Express y SQLite.

## 📋 Características

- ✅ Gestión de categorías (remeras, pantalones, camperas, accesorios, etc.)
- ✅ Gestión de productos con nombre, color, cantidad y foto
- ✅ API REST con endpoints bien definidos
- ✅ Base de datos SQLite para desarrollo
- ✅ Validaciones de datos
- ✅ Búsqueda de productos
- ✅ Control de stock bajo
- ✅ Documentación completa con ejemplos

## 🚀 Instalación y Configuración

### 1. Clonar e instalar dependencias

```bash
cd nita-clothing-stock
npm install
```

### 2. Inicializar la base de datos

```bash
npm run init-db
```

### 3. Ejecutar el servidor

```bash
# Modo desarrollo (con nodemon)
npm run dev

# Modo producción
npm start
```

El servidor estará disponible en: `http://localhost:3000`

## 📁 Estructura del Proyecto

```
nita-clothing-stock/
├── src/
│   ├── config/
│   │   ├── database.js          # Configuración de SQLite
│   │   └── initDatabase.js      # Script de inicialización
│   ├── controllers/
│   │   ├── categoryController.js
│   │   └── productController.js
│   ├── models/
│   │   ├── Category.js
│   │   └── Product.js
│   └── routes/
│       ├── index.js
│       ├── categories.js
│       └── products.js
├── database/
│   └── nita_clothing.db        # Base de datos SQLite
├── app.js                      # Servidor principal
├── package.json
└── README.md
```

## 🗄️ Esquema de Base de Datos

### Tabla: categories
```sql
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: products
```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(200) NOT NULL,
    color VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    photo_url TEXT,
    category_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT
);
```

## 🔗 Endpoints de la API

### 📊 General
- `GET /` - Información general del API
- `GET /api` - Lista de todos los endpoints disponibles
- `GET /health` - Estado del servidor

### 📂 Categorías (`/api/categorias`)

#### Obtener todas las categorías
```http
GET /api/categorias
```

#### Obtener categoría por ID
```http
GET /api/categorias/{id}
```

#### Crear nueva categoría
```http
POST /api/categorias
Content-Type: application/json

{
  "name": "Zapatos",
  "description": "Calzado femenino de todos los estilos"
}
```

#### Actualizar categoría
```http
PUT /api/categorias/{id}
Content-Type: application/json

{
  "name": "Remeras y Tops",
  "description": "Remeras básicas, estampadas y tops para mujer"
}
```

#### Eliminar categoría
```http
DELETE /api/categorias/{id}
```

### 👕 Productos (`/api/productos`)

#### Obtener todos los productos
```http
GET /api/productos
```

#### Obtener producto por ID
```http
GET /api/productos/{id}
```

#### Obtener productos por categoría
```http
GET /api/productos/categoria/{categoryId}
```

#### Buscar productos
```http
GET /api/productos/search?q=remera
GET /api/productos/search?q=negro
```

#### Productos con stock bajo
```http
GET /api/productos/stock-bajo
GET /api/productos/stock-bajo?min=10
```

#### Crear nuevo producto
```http
POST /api/productos
Content-Type: application/json

{
  "name": "Remera Manga Larga",
  "color": "Verde",
  "quantity": 20,
  "photo_url": "https://example.com/remera-verde.jpg",
  "category_id": 1
}
```

#### Actualizar producto completo
```http
PUT /api/productos/{id}
Content-Type: application/json

{
  "name": "Remera Básica Premium",
  "color": "Blanco",
  "quantity": 30,
  "photo_url": "https://example.com/remera-premium-blanco.jpg",
  "category_id": 1
}
```

#### Actualizar solo stock
```http
PATCH /api/productos/{id}/stock
Content-Type: application/json

{
  "quantity": 50
}
```

#### Eliminar producto
```http
DELETE /api/productos/{id}
```

## 🧪 Ejemplos para Postman

### Configuración de Postman

1. **Base URL**: `http://localhost:3000`
2. **Headers por defecto**: 
   - `Content-Type: application/json`

### Colección de Requests

#### 1. Información del API
```
GET {{baseUrl}}/api
```

#### 2. Crear categoría de ejemplo
```
POST {{baseUrl}}/api/categorias
Body:
{
  "name": "Joyería",
  "description": "Anillos, collares y aretes"
}
```

#### 3. Listar todas las categorías
```
GET {{baseUrl}}/api/categorias
```

#### 4. Crear producto de ejemplo
```
POST {{baseUrl}}/api/productos
Body:
{
  "name": "Anillo de Plata",
  "color": "Plateado",
  "quantity": 15,
  "photo_url": "https://example.com/anillo-plata.jpg",
  "category_id": 6
}
```

#### 5. Buscar productos
```
GET {{baseUrl}}/api/productos/search?q=remera
```

#### 6. Ver productos con stock bajo
```
GET {{baseUrl}}/api/productos/stock-bajo?min=5
```

#### 7. Actualizar stock de un producto
```
PATCH {{baseUrl}}/api/productos/1/stock
Body:
{
  "quantity": 100
}
```

## 📊 Respuestas de la API

### Respuesta exitosa
```json
{
  "success": true,
  "message": "Operación completada exitosamente",
  "data": {
    // datos del resultado
  }
}
```

### Respuesta de error
```json
{
  "success": false,
  "message": "Descripción del error",
  "error": "Detalles técnicos del error"
}
```

## 🛠️ Scripts Disponibles

```bash
# Iniciar en modo desarrollo
npm run dev

# Iniciar en modo producción
npm start

# Inicializar/reiniciar base de datos
npm run init-db
```

## 📝 Datos de Ejemplo

Al ejecutar `npm run init-db`, se crean las siguientes categorías y productos de ejemplo:

### Categorías:
- Remeras
- Pantalones  
- Camperas
- Accesorios
- Vestidos

### Productos:
- Remera Básica (Blanco, Negro)
- Jean Skinny, Jean Mom
- Campera de Cuero, Buzo Canguro
- Cartera Crossbody, Cinturón
- Vestidos Casual y de Fiesta

## 🔧 Tecnologías Utilizadas

- **Backend**: Node.js, Express.js
- **Base de Datos**: SQLite3
- **Seguridad**: Helmet, CORS
- **Logging**: Morgan
- **Desarrollo**: Nodemon

## 📈 Funcionalidades Futuras

- [ ] Autenticación y autorización
- [ ] Upload de imágenes de productos
- [ ] Reportes de ventas
- [ ] Historial de movimientos de stock
- [ ] Categorías anidadas
- [ ] Múltiples sucursales

## 🐛 Troubleshooting

### Error de permisos en la base de datos
```bash
# Verificar que el directorio database/ tenga permisos de escritura
chmod 755 database/
```

### Puerto ya en uso
```bash
# Cambiar el puerto en app.js o usar variable de entorno
PORT=3001 npm start
```

### Reinstalar base de datos
```bash
# Eliminar archivo de BD y recrear
rm database/nita_clothing.db
npm run init-db
```

## 📞 Soporte

Para soporte técnico o consultas sobre el sistema, contactar al equipo de desarrollo.

---

**Nita Clothing Stock Management System v1.0.0**
*Desarrollado con ❤️ para Nita Clothing*