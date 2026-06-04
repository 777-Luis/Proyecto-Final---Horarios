const { Client } = require('pg');
const client = new Client({
  user: 'erp_user',
  host: 'localhost',
  database: 'erpdblocal',
  password: 'erp_password',
  port: 5432,
});

async function run() {
  await client.connect();
  const res = await client.query('SELECT * FROM solicitudes_cambio ORDER BY fecha_solicitud DESC LIMIT 5;');
  console.log(res.rows);
  await client.end();
}
run();
