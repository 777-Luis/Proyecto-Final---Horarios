const { Client } = require('pg');

async function updateDB() {
  const client = new Client({
    user: 'erp_user',
    host: 'localhost',
    database: 'erpdblocal',
    password: 'erp_password',
    port: 5432,
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL");
    
    const res = await client.query(`
      UPDATE areas SET sede_id = (
        SELECT id FROM sedes LIMIT 1
      ) WHERE sede_id IS NULL;
    `);
    console.log("Updated rows:", res.rowCount);

    // Get carlos.mendoza's persona ID to assign to TIC area
    // The user requested: "Prueba editar el área TIC y asignar a carlos.mendoza como líder"
    // We will do that via the HTTP endpoint or via script to test it. We can do it via API later.
  } catch (err) {
    console.error("Database error:", err);
  } finally {
    await client.end();
  }
}

updateDB();
