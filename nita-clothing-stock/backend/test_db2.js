require('dotenv').config();
const db = require('./config/database');
const fs = require('fs');
async function run() {
    try {
        const dates = await db.all(`
        SELECT MIN(created_at) as min_date, MAX(created_at) as max_date
        FROM sales
        WHERE status = 'completed' AND DATE_FORMAT(created_at, '%Y-%m') = '2026-03'
    `);

        fs.writeFileSync('result_dates.json', JSON.stringify({
            dates
        }, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
run();
