const { Client } = require('pg');
const client = new Client({ user: 'erp_user', host: 'localhost', database: 'erpdblocal', password: 'erp_password', port: 5432 });
client.connect().then(() => client.query(`UPDATE registro_clases SET estado = 'activa' WHERE estado = 'pendiente' AND hora_activacion IS NOT NULL`)).then(res => { console.log(res.rowCount + ' updated'); process.exit(0); }).catch(err => { console.error(err); process.exit(1); })
