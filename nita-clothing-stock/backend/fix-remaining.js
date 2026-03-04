const fs = require('fs');
const path = require('path');

const basePath = __dirname;

// Fix Sale.js - replace 'disponible' with 'activo'
let sale = fs.readFileSync(path.join(basePath, 'models', 'Sale.js'), 'utf8');
const origSale = sale;
sale = sale.replace(/ELSE "disponible"/g, 'ELSE "activo"');
sale = sale.replace(/estado = "disponible"/g, 'estado = "activo"');
sale = sale.replace(/estado = 'disponible'/g, "estado = 'activo'");
fs.writeFileSync(path.join(basePath, 'models', 'Sale.js'), sale, 'utf8');
console.log('Sale.js:', origSale !== sale ? '✅ CORREGIDO' : '⚠️ sin cambios');

// Verify
const checkSale = fs.readFileSync(path.join(basePath, 'models', 'Sale.js'), 'utf8');
const hasDisponibleSale = checkSale.includes('disponible');
console.log(`  Sale.js aún tiene 'disponible': ${hasDisponibleSale ? '❌ SÍ' : '✅ NO'}`);

// Fix reportController.js - replace 'deleted_at IS NULL' with "estado != 'descontinuado'"
let rep = fs.readFileSync(path.join(basePath, 'controllers', 'reportController.js'), 'utf8');
const origRep = rep;
rep = rep.replace(/deleted_at IS NULL/g, "estado != 'descontinuado'");
fs.writeFileSync(path.join(basePath, 'controllers', 'reportController.js'), rep, 'utf8');
console.log('reportController.js:', origRep !== rep ? '✅ CORREGIDO' : '⚠️ sin cambios');

// Verify
const checkRep = fs.readFileSync(path.join(basePath, 'controllers', 'reportController.js'), 'utf8');
const hasDeletedAt = checkRep.includes('deleted_at IS NULL');
console.log(`  reportController.js aún tiene 'deleted_at IS NULL': ${hasDeletedAt ? '❌ SÍ' : '✅ NO'}`);
