// TEST RÁPIDO DE ENDPOINTS - Sistema Nita Clothing
// Ejecutar con: node test-endpoints.js

const http = require('http');

const API_URL = 'localhost';
const API_PORT = 3000;
const TEST_USER = {
  email: 'admin@nitaclothing.com',
  password: 'admin123'
};

let token = '';

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.blue}═══ ${msg} ═══${colors.reset}`)
};

// Hacer request HTTP
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_URL,
      port: API_PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Login para obtener token
async function login() {
  try {
    const response = await makeRequest('POST', '/api/auth/login', TEST_USER);
    if (response.status === 200 && response.data.token) {
      token = response.data.token;
      log.success('Login exitoso - Token obtenido');
      return true;
    } else {
      log.error(`Login falló: ${response.data.message || 'Error desconocido'}`);
      return false;
    }
  } catch (error) {
    log.error(`Login falló: ${error.message}`);
    return false;
  }
}

// Test genérico de endpoint
async function testEndpoint(name, method, endpoint) {
  try {
    const response = await makeRequest(method, `/api${endpoint}`);
    if (response.status >= 200 && response.status < 300) {
      log.success(`${name} - Status ${response.status}`);
      return true;
    } else {
      log.error(`${name} - Status ${response.status}: ${response.data.message || 'Error'}`);
      return false;
    }
  } catch (error) {
    log.error(`${name} - Error: ${error.message}`);
    return false;
  }
}

// Ejecutar todos los tests
async function runTests() {
  console.log(`${colors.yellow}
╔════════════════════════════════════════════════╗
║   TEST DE ENDPOINTS - NITA CLOTHING SYSTEM    ║
╚════════════════════════════════════════════════╝
${colors.reset}`);

  log.info('Iniciando tests...\n');

  // 1. Login
  log.section('AUTENTICACIÓN');
  if (!await login()) {
    log.error('No se pudo obtener token. Abortando tests.');
    return;
  }

  // 2. Categorías
  log.section('CATEGORÍAS');
  await testEndpoint('GET Categorías', 'GET', '/categorias');
  
  // 3. Productos
  log.section('PRODUCTOS');
  await testEndpoint('GET Productos', 'GET', '/productos');
  await testEndpoint('GET Productos con stock bajo', 'GET', '/productos/stock-bajo?min=10');
  
  // 4. Ventas
  log.section('VENTAS');
  await testEndpoint('GET Ventas', 'GET', '/ventas');
  await testEndpoint('GET Estadísticas de ventas', 'GET', '/ventas/stats');
  
  // 5. Clientes
  log.section('CLIENTES');
  await testEndpoint('GET Clientes', 'GET', '/customers');
  
  // 6. Reservas
  log.section('RESERVAS');
  await testEndpoint('GET Reservas', 'GET', '/reservations');
  await testEndpoint('GET Reservas por vencer', 'GET', '/reservations/expiring');
  
  // 7. Cambios/Devoluciones
  log.section('CAMBIOS Y DEVOLUCIONES');
  await testEndpoint('GET Exchanges/Returns', 'GET', '/exchange-returns');
  
  // 8. Proveedores
  log.section('PROVEEDORES');
  await testEndpoint('GET Proveedores', 'GET', '/suppliers');
  
  // 9. Órdenes de Compra
  log.section('ÓRDENES DE COMPRA');
  await testEndpoint('GET Purchase Orders', 'GET', '/purchase-orders');
  
  // 10. Reportes
  log.section('REPORTES');
  await testEndpoint('GET Reporte General', 'GET', '/reportes');
  await testEndpoint('GET Ventas Diarias', 'GET', '/reportes/daily-sales');
  await testEndpoint('GET Top Productos', 'GET', '/reportes/top-products');
  await testEndpoint('GET Performance', 'GET', '/reportes/performance');
  
  // 11. Alertas (usando endpoints existentes)
  log.section('ALERTAS');
  await testEndpoint('GET Stock Bajo (Alertas)', 'GET', '/productos/stock-bajo?min=5');
  await testEndpoint('GET Reservas Expirando (Alertas)', 'GET', '/reservations/expiring');
  
  // 12. Promociones
  log.section('PROMOCIONES');
  await testEndpoint('GET Promociones', 'GET', '/promociones');
  await testEndpoint('GET Promociones Activas', 'GET', '/promociones/active');

  // Resumen
  console.log(`\n${colors.yellow}╔════════════════════════════════════════════════╗`);
  console.log(`║            TESTS COMPLETADOS                   ║`);
  console.log(`╚════════════════════════════════════════════════╝${colors.reset}\n`);
  
  log.info('Revisa los resultados arriba');
  log.info('✓ = Endpoint funcionando correctamente');
  log.info('✗ = Endpoint con problemas\n');
}

// Verificar que el servidor esté corriendo
async function checkServer() {
  try {
    const response = await makeRequest('GET', '/health');
    if (response.status === 200) {
      log.success('Servidor backend detectado en http://localhost:3000\n');
      return true;
    } else {
      log.error('Servidor backend no responde correctamente');
      return false;
    }
  } catch (error) {
    log.error('No se pudo conectar al servidor backend');
    log.info('Asegúrate de que el servidor esté corriendo: cd backend && node app.js\n');
    return false;
  }
}

// Main
(async () => {
  if (await checkServer()) {
    await runTests();
  }
  process.exit(0);
})();
