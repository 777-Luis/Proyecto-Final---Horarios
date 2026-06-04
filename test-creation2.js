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

    // 2. Create Schedule via API
    console.log('Creating Schedule for curso 2550011 (26e43aa9-855a-4c63-b4b3-b93336e2359e)...');
    const schedulePayload = {
      curso_id: '26e43aa9-855a-4c63-b4b3-b93336e2359e', // 2550011
      ambiente_id: '2f7e47a6-499a-47d9-8ed4-93a3116ccd85', // Aula de Software 1
      jornada: 'Tarde',
      detalles: [
        { dia: 1, hora_inicio: '12:30', hora_fin: '17:00', instructor_id: 'b00652ec-6527-4677-8314-47abd9965d64', es_transversal: false },
      ]
    };

    const createRes = await fetch('http://localhost:3000/api/erp/v1/horarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
      body: JSON.stringify(schedulePayload)
    });
    
    if (!createRes.ok) throw new Error('Create Schedule failed: ' + await createRes.text());
    console.log('Schedule Created successfully!');

  } catch (err) {
    console.error(err);
  }
}
runTest();
