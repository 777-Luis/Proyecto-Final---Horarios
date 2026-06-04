const { Client } = require('pg');
const client = new Client({
  user: 'erp_user',
  host: 'localhost',
  database: 'erpdblocal',
  password: 'erp_password',
  port: 5432,
});

async function seed() {
  try {
    await client.connect();
    const res1 = await client.query(`SELECT id FROM personas WHERE id IN (SELECT persona_id FROM usuarios WHERE rol_id IN (SELECT id FROM roles WHERE nombre='Instructor')) LIMIT 1`);
    const res2 = await client.query(`SELECT id FROM personas WHERE id IN (SELECT persona_id FROM usuarios WHERE rol_id IN (SELECT id FROM roles WHERE nombre='Administrador')) LIMIT 1`);
    
    if (res1.rows[0] && res2.rows[0]) {
      const instId = res1.rows[0].id;
      const adminId = res2.rows[0].id;
      await client.query(`
        INSERT INTO solicitudes_cambio (instructor_id, lider_area_id, tipo_solicitud, descripcion, estado)
        VALUES 
          ($1, $2, 'TRASLADO_JORNADA', 'Solicitud de cambio a jornada nocturna por calamidad doméstica', 'PENDIENTE'),
          ($1, $2, 'CAMBIO_AMBIENTE', 'El ambiente asignado carece de proyectores para el curso 288301', 'ENVIADO_ADMIN'),
          ($1, $2, 'INCAPACIDAD', 'Reporte de incapacidad médica por 3 días, adjunto soportes', 'APROBADO'),
          ($1, $2, 'PERMISO_ESPECIAL', 'Permiso para asistir a reunión departamental de bilingüismo', 'RECHAZADO')
      `, [instId, adminId]);
      console.log('Seeded solicitudes');
    } else {
      console.log('No valid instructor/admin found');
    }
  } catch (error) {
    console.error(error);
  } finally {
    await client.end();
  }
}

seed();
