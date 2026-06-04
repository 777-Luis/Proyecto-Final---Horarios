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
  const res = await client.query(`UPDATE horario_detalle SET hora_inicio = '08:00', hora_fin = '12:00' WHERE id = 'a28ccc5f-0b5a-49e3-b116-397f88100d9f';`);
  console.log(res.rowCount, "row(s) updated.");
  await client.end();
}
run();
