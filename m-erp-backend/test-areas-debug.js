async function test() {
  try {
    const login = await fetch('http://localhost:3000/api/erp/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Admin123*' })
    });
    const { access_token } = await login.json();
    
    // 1. Get carlos.mendoza persona ID
    const usersRes = await fetch('http://localhost:3000/api/erp/v1/users?role=Instructor&limit=100', {
      headers: { 'Authorization': 'Bearer ' + access_token }
    });
    const users = await usersRes.json();
    const carlos = users.data.find(u => u.correo === 'carlos.mendoza@sena.edu.co' || u.nombre.toLowerCase().includes('carlos'));
    if (!carlos) throw new Error("Carlos Mendoza not found");
    const lider_id = carlos.persona_id || carlos.persona?.id || carlos.id; // It should be the Persona ID if the entity Area maps to Persona, wait, Area maps to Persona. Our user response gives 'persona_id' or we can fetch the user directly.
    console.log("Carlos Mendoza Persona ID:", carlos.persona_id || carlos.id);

    // 2. Get TIC Area ID
    const areasRes = await fetch('http://localhost:3000/api/erp/v1/areas', {
      headers: { 'Authorization': 'Bearer ' + access_token }
    });
    const areas = await areasRes.json();
    const tic = areas.find(a => a.nombre === 'TIC');
    if (!tic) throw new Error("TIC Area not found");

    // 3. Update TIC Area
    console.log(`\nUpdating TIC Area (${tic.id}) with lider_id: ${carlos.persona_id || carlos.id}`);
    const patchRes = await fetch(`http://localhost:3000/api/erp/v1/areas/${tic.id}`, {
      method: 'PATCH',
      headers: { 
        'Authorization': 'Bearer ' + access_token,
        'Content-Type': 'application/json' 
      },
      // send the persona_id, but the flat response from users endpoint has id and persona_id. The flat structure sets id=user.id. 
      // If the backend `areas.service` maps to `Persona`, we should use persona_id. 
      body: JSON.stringify({ lider_id: carlos.persona_id || carlos.persona?.id || carlos.id })
    });
    console.log("Patch Status:", patchRes.status);
    console.log("Patch Response:", await patchRes.text());

    // 4. Verify the area
    const finalAreasRes = await fetch('http://localhost:3000/api/erp/v1/areas', {
      headers: { 'Authorization': 'Bearer ' + access_token }
    });
    const finalAreas = await finalAreasRes.json();
    const finalTic = finalAreas.find(a => a.nombre === 'TIC');
    
    console.log("\n--- Final TIC Area ---");
    console.log(JSON.stringify(finalTic, null, 2));

  } catch (err) {
    console.error(err);
  }
}
test();
