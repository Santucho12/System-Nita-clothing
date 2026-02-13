// TEST de creación/actualización automática de clientes al registrar ventas
// Ejecutar con: node test-clientes-automaticos.js

const http = require('http');

const API_URL = 'localhost';
const API_PORT = 3000;
const TEST_USER = {
  email: 'admin@nitaclothing.com',
  password: 'admin123'
};

let token = '';

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
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function login() {
  const response = await makeRequest('POST', '/api/auth/login', TEST_USER);
  if (response.status === 200 && response.data.token) {
    token = response.data.token;
    console.log('✓ Login exitoso');
    return true;
  } else {
    console.error('✗ Login falló:', response.data.message);
    return false;
  }
}

async function crearVenta(email, nombre) {
  const venta = {
    items: [
      { product_id: 1, quantity: 1, unit_price: 100 }
    ],
    customer_name: nombre,
    customer_email: email,
    payment_method: 'efectivo',
    discount_percent: 0,
    discount_amount: 0
  };
  return await makeRequest('POST', '/api/ventas', venta);
}

async function getCliente(email) {
  const response = await makeRequest('GET', `/api/customers/${encodeURIComponent(email)}`);
  return response;
}

(async () => {
  if (!await login()) return;

  const testEmail = 'cliente.test.automatico@nita.com';
  const testName = 'Cliente Automático';

  // 1. Crear venta con email nuevo
  let res = await crearVenta(testEmail, testName);
  if (res.status === 201 && res.data.success) {
    console.log('✓ Venta registrada con cliente nuevo');
  } else {
    console.error('✗ Error al registrar venta con cliente nuevo:', res.data.message);
    return;
  }

  // 2. Verificar que el cliente fue creado
  res = await getCliente(testEmail);
  if (res.status === 200 && res.data.data && res.data.data.email === testEmail) {
    console.log('✓ Cliente creado automáticamente');
  } else {
    console.error('✗ Cliente no fue creado automáticamente');
    return;
  }

  // 3. Registrar otra venta con el mismo email
  res = await crearVenta(testEmail, testName);
  if (res.status === 201 && res.data.success) {
    console.log('✓ Segunda venta registrada para el mismo cliente');
  } else {
    console.error('✗ Error al registrar segunda venta:', res.data.message);
    return;
  }

  // 4. Verificar que el segmento del cliente se actualizó
  res = await getCliente(testEmail);
  if (res.status === 200 && res.data.data && res.data.data.segment && res.data.data.segment !== 'new') {
    console.log('✓ Segmento del cliente actualizado automáticamente:', res.data.data.segment);
  } else {
    console.error('✗ Segmento del cliente no se actualizó correctamente');
    return;
  }

  console.log('✓ Test de clientes automáticos finalizado correctamente');
})();
