const { Client } = require('pg');
const client = new Client({ user: 'erp_user', host: 'localhost', database: 'erpdblocal', password: 'erp_password', port: 5432 });
client.connect();
(async () => {
  try {
    const usuarios = await client.query('SELECT * FROM usuarios');
    const personas = await client.query('SELECT * FROM personas');
    const cursos = await client.query('SELECT * FROM cursos');
    
    console.log(`Usuarios count: ${usuarios.rows.length}`);
    console.log(`Personas count: ${personas.rows.length}`);
    console.log(`Cursos count: ${cursos.rows.length}`);
  } catch (err) {
    console.error(err);
  } finally {
    client.end();
  }
})();
