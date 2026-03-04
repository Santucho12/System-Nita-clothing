const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'models', 'Supplier.js');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Fix create method - simplify destructuring
const oldDestructure = `const {
      name,
      contact_name,
      email,
      phone,
      address,
      city,
      state,
      postal_code,
      country,
      website,
      tax_id,
      payment_terms,
      notes
    } = data;`;

const newDestructure = `const {
      name,
      phone,
      address,
      website,
      min_purchase,
      notes
    } = data;`;

content = content.replace(oldDestructure, newDestructure);
console.log('1. Destructuring simplificado');

// 2. Fix INSERT SQL
const oldSql = `const sql = \`INSERT INTO suppliers (
          name, contact_name, email, phone, address, city, state, 
          postal_code, country, website, tax_id, payment_terms, notes, 
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())\``;

const newSql = `const sql = \`INSERT INTO suppliers (
          name, phone, address, website, min_purchase, notes, 
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())\``;

content = content.replace(oldSql, newSql);
console.log('2. SQL INSERT simplificado');

// 3. Fix params
const oldParams = `const params = [
      name,
      contact_name || null,
      email || null,
      phone || null,
      address || null,
      city || null,
      state || null,
      postal_code || null,
      country || null,
      website || null,
      tax_id || null,
      payment_terms || 'net_30',
      notes || null
    ];`;

const newParams = `const params = [
      name,
      phone || null,
      address || null,
      website || null,
      min_purchase || null,
      notes || null
    ];`;

content = content.replace(oldParams, newParams);
console.log('3. Params simplificados');

// 4. Fix allowedFields in update
const oldAllowed = `const allowedFields = [
      'name', 'contact_name', 'email', 'phone', 'address',
      'city', 'state', 'postal_code', 'country', 'website',
      'tax_id', 'payment_terms', 'notes', 'status'
    ];`;

const newAllowed = `const allowedFields = [
      'name', 'phone', 'address', 'website', 'min_purchase', 'notes', 'status'
    ];`;

content = content.replace(oldAllowed, newAllowed);
console.log('4. allowedFields simplificados');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('5. Archivo guardado (' + content.length + ' bytes)');
