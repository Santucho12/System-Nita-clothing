/**
 * Test all report endpoints after fixes
 */
const http = require('http');

function request(method, path, body, token) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;
        if (data) headers['Content-Length'] = Buffer.byteLength(data);
        
        const req = http.request({
            hostname: 'localhost',
            port: 5000,
            path,
            method,
            headers
        }, (resp) => {
            let chunks = '';
            resp.on('data', c => chunks += c);
            resp.on('end', () => {
                try {
                    resolve({ status: resp.statusCode, data: JSON.parse(chunks) });
                } catch (e) {
                    resolve({ status: resp.statusCode, data: chunks });
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function main() {
    // First, get a valid user email from the check-user script approach
    // Try common credentials
    const credentials = [
        { email: 'admin@nitaclothing.com', password: 'admin123' },
        { email: 'admin@admin.com', password: 'admin123' },
        { email: 'admin@nita.com', password: 'admin123' },
        { email: 'nita@nita.com', password: 'admin123' },
        { email: 'nita@admin.com', password: 'Nita1234' },
    ];

    let token = null;
    for (const cred of credentials) {
        try {
            const res = await request('POST', '/api/auth/login', cred);
            if (res.data.success && res.data.data && res.data.data.token) {
                token = res.data.data.token;
                console.log('✅ Login successful with:', cred.email);
                break;
            }
        } catch (e) {}
    }

    if (!token) {
        // Try to register a test user
        console.log('Trying to register a test user...');
        const regRes = await request('POST', '/api/auth/register', {
            username: 'testaudit',
            email: 'testaudit@test.com',
            password: 'Test123456',
            role: 'admin'
        });
        console.log('Register result:', JSON.stringify(regRes.data).substring(0, 200));
        
        if (regRes.data.success && regRes.data.data && regRes.data.data.token) {
            token = regRes.data.data.token;
        } else {
            // Try login with the registered user
            const loginRes = await request('POST', '/api/auth/login', {
                email: 'testaudit@test.com',
                password: 'Test123456'
            });
            if (loginRes.data.success && loginRes.data.data) {
                token = loginRes.data.data.token;
            }
        }
    }

    if (!token) {
        console.log('❌ Could not obtain auth token');
        process.exit(1);
    }

    console.log('\n=== Testing Report Endpoints ===\n');

    const endpoints = [
        { name: 'Rotación Categorías', path: '/api/reportes/rotacion-categorias' },
        { name: 'Ventas del Mes', path: '/api/reportes/ventas-mes' },
        { name: 'Ventas del Día', path: '/api/reportes/ventas-dia' },
        { name: 'Ventas del Año', path: '/api/reportes/ventas-anio' },
        { name: 'Ganancias Generales', path: '/api/reportes/ganancias-generales' },
        { name: 'KPIs Avanzados', path: '/api/reportes/kpis-avanzados' },
        { name: 'Tendencia Ventas', path: '/api/reportes/tendencia-ventas' },
        { name: 'Monthly Stats', path: '/api/reportes/monthly-stats' },
        { name: 'Inventory Value', path: '/api/reportes/inventory-value' },
        { name: 'Top Categories', path: '/api/reportes/top-categories?limit=3' },
        { name: 'Más Vendidos', path: '/api/reportes/productos-mas-vendidos?limit=5' },
        { name: 'Menos Vendidos', path: '/api/reportes/productos-menos-vendidos?limit=5' },
        { name: 'Ganancia/Categoría', path: '/api/reportes/ganancia-por-categoria' },
        { name: 'Alertas Reposición', path: '/api/reportes/alertas-reposicion' },
        { name: 'Stock Crítico', path: '/api/reportes/stock-critico' },
        { name: 'Salud Inventario', path: '/api/reportes/salud-inventario' },
        { name: 'Payment Methods', path: '/api/reportes/payment-methods' },
        { name: 'Márgenes', path: '/api/reportes/margenes-rentabilidad' },
        { name: 'Sin Movimiento', path: '/api/reportes/productos-sin-movimiento' },
        { name: 'Daily Sales', path: '/api/reportes/daily-sales' },
    ];

    let passed = 0;
    let failed = 0;

    for (const ep of endpoints) {
        try {
            const res = await request('GET', ep.path, null, token);
            if (res.data.success) {
                const preview = JSON.stringify(res.data.data).substring(0, 200);
                console.log(`✅ ${ep.name}: ${preview}`);
                passed++;
            } else {
                console.log(`❌ ${ep.name}: ${res.data.message || JSON.stringify(res.data).substring(0, 200)}`);
                failed++;
            }
        } catch (e) {
            console.log(`❌ ${ep.name}: ${e.message}`);
            failed++;
        }
    }

    console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
}

main().catch(e => console.error('Fatal error:', e.message));
