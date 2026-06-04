const { Client } = require('pg');
(async () => {
  const client = new Client({ user: 'erp_user', host: 'localhost', database: 'erpdblocal', password: 'erp_password', port: 5432 });
  try {
    await client.connect();
    await client.query("UPDATE programas SET tipo_programa = 'Tecnólogo' WHERE tipo_programa IS NULL;");
    console.log("Programas actualizados.");
  } finally {
    await client.end();
  }
})();
