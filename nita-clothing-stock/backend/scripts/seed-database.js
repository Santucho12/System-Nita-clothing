const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const database = require('../config/database');

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getRandomDate = (onlyThisMonth = false) => {
    const now = new Date();
    const startDate = new Date();
    if (onlyThisMonth) {
        startDate.setDate(1); // Start of current month
    } else {
        startDate.setDate(now.getDate() - 90);
    }

    const date = new Date(startDate.getTime() + Math.random() * (now.getTime() - startDate.getTime()));

    // Day weights: Fri (5), Sat (6), Sun (0) are hotspots
    const day = date.getDay();
    const isWeekend = day === 0 || day === 5 || day === 6;
    if (!isWeekend && Math.random() < 0.4) {
        // Shift some weekday sales to hotspots
        date.setDate(date.getDate() + (5 - day) + Math.floor(Math.random() * 2));
    }

    return date.toISOString().slice(0, 19).replace('T', ' ');
};

async function seedDatabase() {
    try {
        console.log('🚀 Iniciando CARGA ULTRA-REALISTA V2...');
        await database.connect();

        await database.run('SET FOREIGN_KEY_CHECKS = 0');
        const tables = ['idempotency_keys', 'sale_items', 'sales', 'exchange_return_items', 'exchanges_returns', 'reservations', 'purchase_order_items', 'purchase_orders', 'productos', 'categorias', 'suppliers', 'customers', 'activity_logs'];
        for (const table of tables) {
            try { await database.run(`TRUNCATE TABLE ${table}`); } catch (e) { }
        }
        await database.run('SET FOREIGN_KEY_CHECKS = 1');

        // 1. Proveedores (16)
        console.log('📦 Insertando 16 proveedores...');
        const suppliersData = [
            ['Textil Global Sur', 'Juan Perez', 'juan@textilglobal.com', '11223344', 'textilglobalsur.com', 55000],
            ['Moda Mayorista OK', 'Ana Lopez', 'ana@modamayorista.com', '11334455', 'modamayorista.com.ar', 35000],
            ['Premium Fabrics', 'Carlos Garcia', 'carlos@premium.com', '11445566', 'premiumfabrics.com', 120000],
            ['Ropa Estilo Directo', 'Sonia Martinez', 'sonia@estilodirecto.com', '11556677', 'estilodirecto.com', 25000],
            ['Confecciones Norte', 'Miguel Angel', 'm.angel@confenorte.com', '11667788', 'confeccionesnorte.biz', 45000],
            ['Boutique Supplier', 'Elena Solis', 'e.solis@boutiquesup.com', '11778899', 'boutiquesupplier.io', 60000],
            ['Textiles Victoria', 'Roberto Perez', 'roberto@victoria.com', '11889900', 'texvictoria.com', 15000],
            ['Hilos y Estilo', 'Patricia Luna', 'p.luna@hilosyestilo.com', '11990011', 'hilosyestilo.ar', 80000],
            ['Algodón & Punto', 'Federico Ruiz', 'federico@algodon.com', '11112222', 'algodonpunto.com', 40000],
            ['Sedería Lux', 'Marina Costa', 'marina@sederialux.com', '11223333', 'sederialux.com', 95000],
            ['Denim Trends', 'Gabriel Sosa', 'gabriel@denim.com', '11334444', 'denimtrends.ar', 70000],
            ['Accesorios Moda', 'Julian Ferro', 'julian@accmode.com', '11445555', 'accemode.com', 10000],
            ['Lencería Aura', 'Silvia Vega', 'silvia@aura.com', '11556666', 'lenceriaaura.com', 30000],
            ['Sport Gear Arg', 'Luciano Paz', 'luciano@sportgear.com', '11667777', 'sportgear.com.ar', 50000],
            ['Infantiles Sol', 'Vanesa Oro', 'vanesa@infantiles.com', '11778888', 'infantilessol.com', 20000],
            ['Telas y Diseño', 'Oscar Diaz', 'oscar@telasdiseno.com', '11889999', 'telasdiseno.com', 55000]
        ];
        const supplierIds = [];
        for (const s of suppliersData) {
            const res = await database.run('INSERT INTO suppliers (name, contact_name, email, phone, website, min_order_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [...s, 'active']);
            supplierIds.push(res.insertId);
        }

        // 2. Categorías
        const categories = {
            'Remeras': ['S', 'M', 'L', 'XL'],
            'Pantalones': ['38', '40', '42', '44', '46'],
            'Vestidos': ['S', 'M', 'L'],
            'Abrigos': ['M', 'L', 'XL'],
            'Accesorios': ['Unico'],
            'Calzado': ['36', '37', '38', '39', '40', '41', '42'],
            'Ropa Interior': ['S', 'M', 'L'],
            'Deportiva': ['M', 'L', 'XL']
        };
        const categoryIds = {};
        for (const c in categories) {
            const res = await database.run('INSERT INTO categorias (nombre) VALUES (?)', [c]);
            categoryIds[c] = res.insertId;
        }

        // 3. Imágenes (Updated with cleaner URLs)
        const images = {
            'Remeras': ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'],
            'Pantalones': ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=800', 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800'],
            'Vestidos': ['https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800'],
            'Abrigos': ['https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=800', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800'],
            'Accesorios': ['https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=800', 'https://images.unsplash.com/photo-1521335629791-ce4aec67dd15?w=800'],
            'Calzado': ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800'],
            'Ropa Interior': ['https://images.unsplash.com/photo-1582232872442-99c51206f406?w=800'],
            'Deportiva': ['https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=800']
        };

        const adjs = ['Éter', 'Obsidiana', 'Aurora', 'Zenit', 'Esencia', 'Vintage', 'Elite', 'Urbano', 'Velvet', 'Seda', 'Marfil', 'Cobalto', 'Nostalgia', 'Infinito'];
        const types = {
            'Remeras': ['Crop Top', 'Blusa', 'Polera', 'Henley', 'Jersey'],
            'Pantalones': ['Jean Slouchy', 'Chino Tradicional', 'Jogger Cargo', 'Legging Fit', 'Palazzo'],
            'Vestidos': ['Vestido Gala', 'Solero Verano', 'Vestido Coctail', 'Mini Tunica'],
            'Abrigos': ['Campera Cuero', 'Parka Clásica', 'Tapado Lana', 'Hoodie'],
            'Accesorios': ['Cinto Cuero', 'Pañuelo Seda', 'Gafas Sol', 'Cartera Mano'],
            'Calzado': ['Bota Urbana', 'Zapatilla Runner', 'Sandalia Gala', 'Mocasin'],
            'Ropa Interior': ['Conjunto Encaje', 'Boxer Algodón', 'Body Rib'],
            'Deportiva': ['Top Running', 'Calza Ciclista', 'Windbreaker']
        };

        // 4. Productos (180 Total)
        console.log('👕 Generando 180 productos creativos...');
        const productsInfo = [];
        for (let i = 0; i < 180; i++) {
            const catName = random(Object.keys(categories));
            const name = `${random(types[catName])} ${random(adjs)}`;
            const cost = Math.floor(Math.random() * 20000) + 4000;
            const price = Math.floor(cost * (1.5 + Math.random()));
            // Start with enough stock
            const stock = Math.floor(Math.random() * 50) + 15;

            const res = await database.run(
                'INSERT INTO productos (nombre, categoria_id, precio, costo, stock, codigo, tallas, colores, imagen_url, supplier_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [name, categoryIds[catName], price, cost, stock, (i + 1).toString(), random(categories[catName]), random(['Negro', 'Blanco', 'Azul', 'Beige', 'Gris', 'Verde']), JSON.stringify([random(images[catName])]), random(supplierIds)]
            );
            productsInfo.push({ id: res.insertId, price, cost, nombre: name, cod: (i + 1).toString(), stock });
        }

        // 5. Clientes (40)
        const clients = [];
        const fNames = ['Marcos', 'Agustina', 'Florencia', 'Joaquin', 'Delfina', 'Lucas', 'Mora', 'Bautista', 'Valentina', 'Mateo', 'Emma', 'Santi', 'Pilar', 'Nico'];
        const lNames = ['Peralta', 'Gomez', 'Rodriguez', 'Sosa', 'Bianchi', 'Fernandez', 'Lucchese', 'Duarte', 'Castro', 'Arias'];
        for (let i = 0; i < 40; i++) {
            const fn = random(fNames);
            const ln = random(lNames);
            const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@gmail.com`;
            const name = `${fn} ${ln}`;
            await database.run('INSERT INTO customers (email, name, segment) VALUES (?, ?, ?)', [email, name, random(['frequent', 'occasional', 'new'])]);
            clients.push({ email, name });
        }

        // 6. Ventas (320 - Massive)
        console.log('💰 Generando 320 ventas (simulación de agotamiento)...');
        const pMethods = ['efectivo', 'tarjeta', 'transferencia'];
        const currentStock = {};
        productsInfo.forEach(p => currentStock[p.id] = p.stock);

        // Identify 15 products to DEFINITELY exhaust
        const exhaustIds = productsInfo.slice(0, 15).map(p => p.id);

        for (let i = 0; i < 320; i++) {
            // Last 30 sales are strictly this month
            const isRecent = i > 290;
            const date = getRandomDate(isRecent);
            const client = random(clients);
            const numItems = Math.floor(Math.random() * 3) + 1;

            let st = 0;
            let tc = 0;
            const items = [];

            for (let j = 0; j < numItems; j++) {
                const prod = random(productsInfo);
                let qty = Math.floor(Math.random() * 2) + 1;

                // If it's a target for exhaustion, sell more
                if (exhaustIds.includes(prod.id)) qty = Math.floor(Math.random() * 4) + 2;

                if (currentStock[prod.id] > 0) {
                    const actual = Math.min(qty, currentStock[prod.id]);
                    currentStock[prod.id] -= actual;

                    const pS = prod.price * actual;
                    const pC = prod.cost * actual;
                    st += pS;
                    tc += pC;
                    items.push([prod.id, prod.nombre, prod.cod, actual, prod.price, prod.cost, pS, pS - pC, date]);
                }
            }

            if (items.length > 0) {
                const sR = await database.run(
                    'INSERT INTO sales (sale_number, customer_name, customer_email, payment_method, subtotal, total, total_cost, total_profit, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [`V-${2000 + i}`, client.name, client.email, random(pMethods), st, st, tc, st - tc, date]
                );
                for (const it of items) {
                    await database.run(
                        'INSERT INTO sale_items (sale_id, product_id, product_name, product_code, quantity, unit_price, unit_cost, subtotal, profit, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [sR.insertId, ...it]
                    );
                }
            }
        }

        // Sync final stock
        console.log('📉 Sincronizando stock final...');
        for (const pid in currentStock) {
            const s = currentStock[pid];
            await database.run('UPDATE productos SET stock = ?, estado = ? WHERE id = ?', [s, s > 0 ? 'activo' : 'sin_stock', pid]);
        }

        console.log('✨ ÉXITO TOTAL: 180 productos con imágenes corregidas, 16 proveedores, 300+ ventas.');
        process.exit(0);
    } catch (e) {
        console.error('❌ ERROR:', e);
        process.exit(1);
    }
}
seedDatabase();
