const axios = require('axios');

async function testApi() {
    try {
        const response = await axios.get('http://localhost:5000/api/productos');
        console.log('API Status:', response.status);
        console.log('Success:', response.data.success);
        if (response.data.data && response.data.data.length > 0) {
            const p = response.data.data[0];
            console.log('Sample Product data:', JSON.stringify({
                nombre: p.nombre,
                codigo: p.codigo,
                sku: p.sku,
                images: p.images
            }, null, 2));
        }
        process.exit(0);
    } catch (e) {
        console.error('API Error:', e.message);
        process.exit(1);
    }
}
testApi();
