const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'models', 'Supplier.js');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Replace the create destructuring (lines 8-22)
content = content.replace(
  /const \{\s*name,\s*contact_name,\s*email,\s*phone,\s*address,\s*city,\s*state,\s*postal_code,\s*country,\s*website,\s*tax_id,\s*payment_terms,\s*notes\s*\} = data;/s,
  `const {\n      name,\n      phone,\n      address,\n      website,\n      min_purchase,\n      notes\n    } = data;`
);
console.log('1. Destructuring simplificado');

// 2. Replace the INSERT SQL
content = content.replace(
  /const sql = `INSERT INTO suppliers \(\s*name, contact_name, email, phone, address, city, state,\s*postal_code, country, website, tax_id, payment_terms, notes,\s*status, created_at, updated_at\s*\) VALUES \(\?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, 'active', NOW\(\), NOW\(\)\)\s*`;/s,
  "const sql = `INSERT INTO suppliers (\n          name, phone, address, website, min_purchase, notes,\n          status, created_at, updated_at\n        ) VALUES (?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())`;"
);
console.log('2. SQL INSERT simplificado');

// 3. Replace the params array
content = content.replace(
  /const params = \[\s*name,\s*contact_name \|\| null,\s*email \|\| null,\s*phone \|\| null,\s*address \|\| null,\s*city \|\| null,\s*state \|\| null,\s*postal_code \|\| null,\s*country \|\| null,\s*website \|\| null,\s*tax_id \|\| null,\s*payment_terms \|\| 'net_30',\s*notes \|\| null\s*\];/s,
  `const params = [\n      name,\n      phone || null,\n      address || null,\n      website || null,\n      min_purchase || null,\n      notes || null\n    ];`
);
console.log('3. Params simplificados');

// 4. Replace allowedFields in update
content = content.replace(
  /const allowedFields = \[\s*'name', 'contact_name', 'email', 'phone', 'address',\s*'city', 'state', 'postal_code', 'country', 'website',\s*'tax_id', 'payment_terms', 'notes', 'status'\s*\];/s,
  `const allowedFields = [\n      'name', 'phone', 'address', 'website', 'min_purchase', 'notes', 'status'\n    ];`
);
console.log('4. allowedFields simplificados');

// 5. Remove email and city filter blocks from getAll
content = content.replace(
  /\n\s*if \(filters\.email\) \{\s*query \+= ' AND s\.email LIKE \?';\s*params\.push\(`%\$\{filters\.email\}%`\);\s*\}\s*\n\s*if \(filters\.city\) \{\s*query \+= ' AND s\.city LIKE \?';\s*params\.push\(`%\$\{filters\.city\}%`\);\s*\}\s*\n\s*if \(filters\.country\) \{\s*query \+= ' AND s\.country = \?';\s*params\.push\(filters\.country\);\s*\}/s,
  ''
);
console.log('5. Filtros email/city/country removidos');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('6. Archivo guardado (' + content.length + ' bytes)');
