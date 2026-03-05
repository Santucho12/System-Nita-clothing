const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const database = require('../config/database');

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const now = new Date(); // Global reference for seeding

const getRandomDate = (mode = 'normal') => {
    const date = new Date(now.getFullYear(), now.getMonth(), 1); // Start of current month

    if (mode === 'current_month') {
        // Pick a random day between 1st and 28th to ensure we have full complete weeks
        date.setDate(1 + Math.floor(Math.random() * 28));
    } else {
        // Last 100 days
        const startDate = new Date();
        startDate.setDate(now.getDate() - 100);
        date.setTime(startDate.getTime() + Math.random() * (now.getTime() - startDate.getTime()));
    }

    const day = date.getDay();
    // User Request: Fri (5), Sat (6) are the main days
    const isPeak = day === 5 || day === 6;

    if (!isPeak && Math.random() < 0.8) {
        // Shift 80% of non-peak sales to Fri-Sat
        // Find the next Friday or Saturday from this date
        const offsetToFriday = (5 - day + 7) % 7;
        const offsetToSaturday = (6 - day + 7) % 7;
        date.setDate(date.getDate() + (Math.random() < 0.5 ? offsetToFriday : offsetToSaturday));
    }

    // Assign a random time between 10 AM and 8 PM
    date.setHours(10 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0);

    return date.toISOString().slice(0, 19).replace('T', ' ');
};

async function seedDatabase() {
    try {
        console.log('🚀 Iniciando CARGA ULTRA-REALISTA V3...');
        await database.connect();

        await database.run('SET FOREIGN_KEY_CHECKS = 0');
        const tables = ['idempotency_keys', 'sale_items', 'sales', 'exchange_return_items', 'exchanges_returns', 'reservations', 'purchase_order_items', 'purchase_orders', 'productos', 'categorias', 'suppliers', 'customers', 'activity_logs'];
        for (const table of tables) {
            try { await database.run(`TRUNCATE TABLE ${table}`); } catch (e) { }
        }
        await database.run('SET FOREIGN_KEY_CHECKS = 1');

        // 1. Proveedores (16)
        console.log('📦 Insertando proveedores con mínimos...');
        const suppliersData = [
            ['Textil Global Sur', 'Juan Perez', 'juan@textilglobal.com', '11223344', 'textilglobalsur.com', 55000],
            ['Moda Mayorista OK', 'Ana Lopez', 'ana@modamayorista.com', '11334455', 'modamayorista.com.ar', 35000],
            ['Premium Fabrics', 'Carlos Garcia', 'carlos@premium.com', '11445566', 'premiumfabrics.com', 120000],
            ['Ropa Estilo Directo', 'Sonia Martinez', 'sonia@estilodirecto.com', '11556677', 'estilodirecto.com', 25000],
            ['Confecciones Norte', 'Miguel Angel', 'm.angel@confenorte.com', '11667788', 'confeccionesnorte.biz', 45000],
            ['Boutique Supplier', 'Elena Solis', 'e.solis@boutiquesup.com', '11778899', 'boutiquesupplier.io', 60000],
            ['Sedería Lux', 'Marina Costa', 'marina@sederialux.com', '11223333', 'sederialux.com', 95000],
            ['Sport Gear Arg', 'Luciano Paz', 'luciano@sportgear.com', '11667777', 'sportgear.com.ar', 50000]
        ];
        const supplierIds = [];
        for (const s of suppliersData) {
            const res = await database.run('INSERT INTO suppliers (name, contact_name, email, phone, website, min_order_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [...s, 'active']);
            supplierIds.push(res.insertId);
        }

        // 2. Categorías (with Descriptions)
        const categories = {
            'Remeras': {
                desc: 'Prendas superiores de algodón y tejidos frescos.',
                sizes: ['S', 'M', 'L', 'XL'],
                imgs: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'],
                types: ['Crop Top', 'Blusa', 'Polera', 'Henley', 'Jersey']
            },
            'Pantalones': {
                desc: 'Jeans, chinos y joggers de alta calidad y calce perfecto.',
                sizes: ['38', '40', '42', '44', '46'],
                imgs: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=800', 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800'],
                types: ['Jean Slouchy', 'Chino Tradicional', 'Jogger Cargo', 'Legging Fit', 'Palazzo']
            },
            'Vestidos': {
                desc: 'Elegancia y frescura para toda ocasión.',
                sizes: ['S', 'M', 'L'],
                imgs: ['https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800'],
                types: ['Vestido Gala', 'Solero Verano', 'Vestido Coctail', 'Mini Tunica']
            },
            'Abrigos': {
                desc: 'Prendas térmicas, parkas y camperas de invierno.',
                sizes: ['M', 'L', 'XL'],
                imgs: ['https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=800', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800'],
                types: ['Campera Cuero', 'Parka Clásica', 'Tapado Lana', 'Hoodie']
            },
            'Accesorios': {
                desc: 'Complementos esenciales para tu outfit.',
                sizes: ['Unico'],
                imgs: ['https://images.unsplash.com/photo-1624222247344-550db800789a?w=800', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800'],
                types: ['Cinto Cuero', 'Pañuelo Seda', 'Cartera Mano', 'Sombrero Fedora']
            },
            'Calzado': {
                desc: 'Zapatillas urbanas, botas y sandalias.',
                sizes: ['36', '37', '38', '39', '40', '41', '42'],
                imgs: ['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800', 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800'],
                types: ['Bota Urbana', 'Zapatilla Runner', 'Sandalia Gala', 'Mocasin']
            },
            'Ropa Interior': {
                desc: 'Comodidad y diseño en tu primera piel.',
                sizes: ['S', 'M', 'L'],
                imgs: ['https://images.unsplash.com/photo-1582232872442-99c51206f406?w=800', 'https://images.unsplash.com/photo-1626290025983-a44ced66b74e?w=800'],
                types: ['Conjunto Encaje', 'Boxer Algodón', 'Body Rib']
            },
            'Deportiva': {
                desc: 'Prendas técnicas para tu entrenamiento.',
                sizes: ['M', 'L', 'XL'],
                imgs: ['https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=800', 'https://images.unsplash.com/photo-1506152983158-b4a74a01c70e?w=800'],
                types: ['Top Running', 'Calza Ciclista', 'Windbreaker']
            }
        };

        const categoryIds = {};
        for (const c in categories) {
            const res = await database.run('INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)', [c, categories[c].desc]);
            categoryIds[c] = res.insertId;
        }

        // 3. Productos (180 Total)
        console.log('👕 Generando 180 productos coherentes...');
        const adjs = ['Éter', 'Obsidiana', 'Aurora', 'Zenit', 'Esencia', 'Vintage', 'Elite', 'Urbano', 'Velvet', 'Seda', 'Marfil', 'Cobalto', 'Nostalgia', 'Infinito'];
        const productsInfo = [];
        for (let i = 0; i < 180; i++) {
            const catName = random(Object.keys(categories));
            const cat = categories[catName];
            const name = `${random(cat.types)} ${random(adjs)}`;
            const cost = Math.floor(Math.random() * 20000) + 4000;
            const price = Math.floor(cost * (1.5 + Math.random()));
            const stock = Math.floor(Math.random() * 50) + 15;

            const res = await database.run(
                'INSERT INTO productos (nombre, categoria_id, precio, costo, stock, codigo, tallas, colores, imagen_url, supplier_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [name, categoryIds[catName], price, cost, stock, (i + 1).toString(), random(cat.sizes), random(['Negro', 'Blanco', 'Azul Marino', 'Bordó', 'Marfil', 'Oliva', 'Beige', 'Gris Melange']), JSON.stringify([random(cat.imgs)]), random(supplierIds)]
            );
            productsInfo.push({ id: res.insertId, price, cost, nombre: name, cod: (i + 1).toString(), stock });
        }

        // 4. Clientes (45 - Active vs Ghost)
        const clients = [];
        const fNames = ['Marcos', 'Agustina', 'Florencia', 'Joaquin', 'Delfina', 'Lucas', 'Mora', 'Bautista', 'Valentina', 'Mateo', 'Emma', 'Santi', 'Pilar', 'Nico', 'Tomas', 'Candela'];
        const lNames = ['Peralta', 'Gomez', 'Rodriguez', 'Sosa', 'Bianchi', 'Fernandez', 'Lucchese', 'Duarte', 'Castro', 'Arias'];
        for (let i = 0; i < 45; i++) {
            const fn = random(fNames);
            const ln = random(lNames);
            const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@gmail.com`;
            const name = `${fn} ${ln}`;
            await database.run('INSERT INTO customers (email, name, segment) VALUES (?, ?, ?)', [email, name, random(['frequent', 'occasional', 'new'])]);

            // 20% ghost clients (bought long ago, only once)
            const isGhost = Math.random() < 0.2;
            clients.push({ email, name, isGhost });
        }

        // 5. Ventas (500 - Peak dominance & Current Month focus)
        console.log('💰 Generando 500 ventas (picos Viernes/Sabado y Foco este mes)...');
        const pMethods = ['efectivo', 'tarjeta', 'transferencia'];
        const currentStock = {};
        productsInfo.forEach(p => currentStock[p.id] = p.stock);

        for (let i = 0; i < 500; i++) {
            const client = random(clients);

            let date;
            if (client.isGhost) {
                const oldDate = new Date();
                oldDate.setDate(now.getDate() - (80 + Math.floor(Math.random() * 20)));
                date = oldDate.toISOString().slice(0, 19).replace('T', ' ');
                if (Math.random() > 0.15) continue;
            } else {
                // 70% of sales in current month
                const isCurrentMonth = Math.random() < 0.7;
                date = getRandomDate(isCurrentMonth ? 'current_month' : 'normal');
            }

            const numItems = Math.floor(Math.random() * 3) + 1;
            let st = 0;
            let tc = 0;
            const items = [];

            for (let j = 0; j < numItems; j++) {
                const prod = random(productsInfo);
                const qty = Math.floor(Math.random() * 2) + 1;

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
                    [`V-${3000 + i}`, client.name, client.email, random(pMethods), st, st, tc, st - tc, date]
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

        console.log('✨ ÉXITO TOTAL V3: Fotos coherentes, ventas jueves-sabado, descripciones de categorías.');
        process.exit(0);
    } catch (e) {
        console.error('❌ ERROR:', e);
        process.exit(1);
    }
}
seedDatabase();
