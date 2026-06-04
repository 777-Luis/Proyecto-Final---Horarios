async function runTest() {
  try {
    // 1. Admin login
    console.log('Logging in as Admin...');
    const adminLogin = await fetch('http://localhost:3000/api/erp/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Admin123*' })
    });
    if (!adminLogin.ok) throw new Error('Admin login failed: ' + adminLogin.statusText);
    const { access_token: adminToken } = await adminLogin.json();

    // 2. Create Schedule via API (using the exact integers mapped payload that the frontend sends)
    console.log('Creating Schedule for curso 2550010 (ac3c6c01-a809-4887-81f6-fb1e1ca9b7aa)...');
    const schedulePayload = {
      curso_id: 'ac3c6c01-a809-4887-81f6-fb1e1ca9b7aa', // 2550010
      ambiente_id: '2f7e47a6-499a-47d9-8ed4-93a3116ccd85', // Aula de Software 1
      jornada: 'Mañana',
      detalles: [
        { dia: 1, hora_inicio: '07:00', hora_fin: '12:00', instructor_id: 'a2a5d83c-6983-4d77-9ff3-0566ccb7d1a0', es_transversal: false },
        { dia: 2, hora_inicio: '07:00', hora_fin: '12:00', instructor_id: 'a2a5d83c-6983-4d77-9ff3-0566ccb7d1a0', es_transversal: false },
        { dia: 3, hora_inicio: '07:00', hora_fin: '12:00', instructor_id: 'a2a5d83c-6983-4d77-9ff3-0566ccb7d1a0', es_transversal: false },
        { dia: 4, hora_inicio: '07:00', hora_fin: '12:00', instructor_id: 'a2a5d83c-6983-4d77-9ff3-0566ccb7d1a0', es_transversal: false },
        { dia: 5, hora_inicio: '07:00', hora_fin: '12:00', instructor_id: 'a2a5d83c-6983-4d77-9ff3-0566ccb7d1a0', es_transversal: false },
      ]
    };

    const createRes = await fetch('http://localhost:3000/api/erp/v1/horarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
      body: JSON.stringify(schedulePayload)
    });
    
    if (!createRes.ok) throw new Error('Create Schedule failed: ' + await createRes.text());
    console.log('Schedule Created successfully!');

    // 3. Instructor login
    console.log('Logging in as carlos.mendoza...');
    const instLogin = await fetch('http://localhost:3000/api/erp/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'carlos.mendoza', password: 'Instructor123*' })
    });
    if (!instLogin.ok) throw new Error('Instructor login failed');
    const { access_token: instToken } = await instLogin.json();

    // 4. Fetch instructor's Mi Horario
    console.log('Fetching Mi Horario...');
    const personaId = 'a2a5d83c-6983-4d77-9ff3-0566ccb7d1a0';
    const horRes = await fetch('http://localhost:3000/api/erp/v1/horarios/instructor/' + personaId, {
      headers: { 'Authorization': 'Bearer ' + instToken }
    });
    if (!horRes.ok) throw new Error('Fetch Mi Horario failed');
    const horarios = await horRes.json();
    
    console.log(`Instructor schedule array length: ${horarios.length}`);
    if (horarios.length === 5) {
      console.log('Success: All 5 days fetched correctly from Monday to Friday.');
      console.log('Sample detail:', horarios[0].dia, horarios[0].hora_inicio, horarios[0].hora_fin);
    }
  } catch (err) {
    console.error(err);
  }
}
runTest();
