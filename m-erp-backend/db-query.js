const { Client } = require('pg');
const fs = require('fs');
const client = new Client({ user: 'erp_user', host: 'localhost', database: 'erpdblocal', password: 'erp_password', port: 5432 });
client.connect();
client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public';", (err, res) => {
  if (err) console.error(err);
  else {
    fs.writeFileSync('tables.json', JSON.stringify(res.rows.map(r => r.table_name), null, 2));
    console.log('done');
  }
  client.end();
});
