const { Client } = require('pg');
const fs = require('fs');
const client = new Client({ user: 'erp_user', host: 'localhost', database: 'erpdblocal', password: 'erp_password', port: 5432 });
client.connect();
client.query("SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public';", (err, res) => {
  if(err) console.error(err);
  else {
      let schema = {};
      res.rows.forEach(r => {
          if (!schema[r.table_name]) schema[r.table_name] = [];
          schema[r.table_name].push(r.column_name);
      });
      fs.writeFileSync('all_columns.json', JSON.stringify(schema, null, 2));
      console.log('Columns dumped successfully!');
  }
  client.end();
});
