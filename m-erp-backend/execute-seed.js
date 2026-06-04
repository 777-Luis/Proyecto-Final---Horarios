const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({ user: 'erp_user', host: 'localhost', database: 'erpdblocal', password: 'erp_password', port: 5432 });

(async () => {
    try {
        await client.connect();
        await client.query('BEGIN');

        console.log('Cleaning up previous test data...');
        await client.query("DELETE FROM matriculas");
        await client.query("DELETE FROM usuarios WHERE credencial_id IN (SELECT id FROM credenciales WHERE username IN ('inst1','inst2','apr1','apr2'))");
        await client.query("DELETE FROM credenciales WHERE username IN ('inst1','inst2','apr1','apr2')");
        await client.query("DELETE FROM personas WHERE numero_documento IN ('10001','10002','20001','20002')");
        
        console.log('Generating password hash...');
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('Sena123*', salt);

        console.log('Seeding areas...');
        const checkArea = await client.query(`SELECT id FROM areas WHERE nombre='TIC'`);
        let areaId;
        if(checkArea.rows.length) areaId = checkArea.rows[0].id;
        else {
            const res = await client.query(`INSERT INTO areas (nombre) VALUES ('TIC') RETURNING id`);
            areaId = res.rows[0].id;
        }

        console.log('Seeding ambientes...');
        const checkAmb = await client.query(`SELECT id FROM ambientes WHERE nombre='Aula de Software 1'`);
        let ambId;
        if(checkAmb.rows.length) ambId = checkAmb.rows[0].id;
        else {
            const res = await client.query(`INSERT INTO ambientes (nombre, capacidad, area_id) VALUES ('Aula de Software 1', 30, $1) RETURNING id`, [areaId]);
            await client.query(`INSERT INTO ambientes (nombre, capacidad, area_id) VALUES ('Laboratorio IA', 25, $1)`, [areaId]);
            ambId = res.rows[0].id;
        }

        console.log('Seeding programas...');
        const checkProg = await client.query(`SELECT id FROM programas WHERE nombre='ADSO'`);
        let progId;
        if (checkProg.rows.length) progId = checkProg.rows[0].id;
        else {
            const res = await client.query(`INSERT INTO programas (nombre, area_id) VALUES ('ADSO', $1) RETURNING id`, [areaId]);
            progId = res.rows[0].id;
        }

        console.log('Seeding cursos...');
        const checkCur1 = await client.query(`SELECT id FROM cursos WHERE id_curso=2550010`);
        let cur1Id;
        if (checkCur1.rows.length) cur1Id = checkCur1.rows[0].id;
        else {
            const res = await client.query(`INSERT INTO cursos (id_curso, programa_id, area_id, inicio_lectiva, fin_lectiva, jornada, nivel_formacion, ambiente_id) VALUES (2550010, $1, $2, '2025-01-01', '2025-12-31', 'Mañana', 'Tecnólogo', $3) RETURNING id`, [progId, areaId, ambId]);
            cur1Id = res.rows[0].id;
        }

        const checkCur2 = await client.query(`SELECT id FROM cursos WHERE id_curso=2550011`);
        let cur2Id;
        if (checkCur2.rows.length) cur2Id = checkCur2.rows[0].id;
        else {
            const res = await client.query(`INSERT INTO cursos (id_curso, programa_id, area_id, inicio_lectiva, fin_lectiva, jornada, nivel_formacion, ambiente_id) VALUES (2550011, $1, $2, '2025-01-01', '2025-12-31', 'Tarde', 'Tecnólogo', $3) RETURNING id`, [progId, areaId, ambId]);
            cur2Id = res.rows[0].id;
        }

        console.log('Fetching roles...');
        const rolInstRes = await client.query(`SELECT id FROM roles WHERE nombre = 'Instructor'`);
        const rolAprRes = await client.query(`SELECT id FROM roles WHERE nombre = 'Aprendiz'`);
        if(!rolInstRes.rows.length || !rolAprRes.rows.length) {
            throw new Error('Roles not found. Run admin seed first.');
        }
        const rolInstId = rolInstRes.rows[0].id;
        const rolAprId = rolAprRes.rows[0].id;

        console.log('Seeding Instructors...');
        for (let i = 1; i <= 2; i++) {
            const checkPers = await client.query(`SELECT id FROM personas WHERE numero_documento='1000${i}'`);
            if(!checkPers.rows.length) {
                let persRes = await client.query(`INSERT INTO personas (nombre, tipo_documento, numero_documento, correo, estado) VALUES ($1, 'CC', $2, $3, true) RETURNING id`, [`Instructor de Prueba ${i}`, `1000${i}`, `inst${i}@sena.com`]);
                let credRes = await client.query(`INSERT INTO credenciales (username, password_hash) VALUES ($1, $2) RETURNING id`, [`inst${i}`, hash]);
                await client.query(`INSERT INTO usuarios (persona_id, credencial_id, rol_id, estado) VALUES ($1, $2, $3, true)`, [persRes.rows[0].id, credRes.rows[0].id, rolInstId]);
            }
        }

        console.log('Seeding Learners...');
        for (let i = 1; i <= 2; i++) {
            const checkPers = await client.query(`SELECT id FROM personas WHERE numero_documento='2000${i}'`);
            if(!checkPers.rows.length) {
                let persRes = await client.query(`INSERT INTO personas (nombre, tipo_documento, numero_documento, correo, estado) VALUES ($1, 'TI', $2, $3, true) RETURNING id`, [`Aprendiz de Prueba ${i}`, `2000${i}`, `apr${i}@sena.com`]);
                let credRes = await client.query(`INSERT INTO credenciales (username, password_hash) VALUES ($1, $2) RETURNING id`, [`apr${i}`, hash]);
                let userRes = await client.query(`INSERT INTO usuarios (persona_id, credencial_id, rol_id, estado) VALUES ($1, $2, $3, true) RETURNING id`, [persRes.rows[0].id, credRes.rows[0].id, rolAprId]);
                let cursoId = i === 1 ? cur1Id : cur2Id;
                await client.query(`INSERT INTO matriculas (aprendiz_id, curso_id, estado) VALUES ($1, $2, 'ACTIVA')`, [persRes.rows[0].id, cursoId]);
            }
        }

        await client.query('COMMIT');
        console.log('SEED COMPLETE: Database fully injected with test data!');

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('SEED FAILED:', e);
    } finally {
        await client.end();
    }
})();
