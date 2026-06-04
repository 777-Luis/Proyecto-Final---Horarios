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
  const res = await client.query(`SELECT id, dia, fecha_inicio_competencia, fecha_fin_competencia FROM horario_detalle WHERE id = 'a28ccc5f-0b5a-49e3-b116-397f88100d9f';`);
  console.log(res.rows);
  await client.end();
}
run();
