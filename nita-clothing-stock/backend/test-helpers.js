// Helpers para los tests de relaciones
const http = require('http');

const API_URL = 'localhost';
const API_PORT = 5000;
const TEST_USER = {
  email: 'admin@nita.com',
  password: '123456'
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

module.exports = { makeRequest, login };
