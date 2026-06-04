async function test() {
  try {
    const login = await fetch('http://localhost:3000/api/erp/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Admin123*' })
    });
    const { access_token } = await login.json();
    console.log("Token:", access_token ? "OK" : "Failed");

    console.log("\n--- GET AREAS ---");
    const getRes = await fetch('http://localhost:3000/api/erp/v1/areas', {
      headers: { 'Authorization': 'Bearer ' + access_token }
    });
    const getBody = await getRes.json();
    console.log("Status:", getRes.status);
    console.log("Body:", JSON.stringify(getBody, null, 2));

    let areaId = getBody[0]?.id;

    console.log("\n--- PATCH AREA ---");
    // PATCH payload: the frontend sends { lider_id: ... } or similar
    // The frontend code: { nombre: '...', sede_id: '...', lider_id: '...' }
    // Let's assume some lider_id and sede_id from DB. Wait, if it fails even without them, let's send just { nombre: 'TIC Modificado' }
    if (areaId) {
      const patchRes = await fetch(`http://localhost:3000/api/erp/v1/areas/${areaId}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': 'Bearer ' + access_token,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ nombre: 'TIC Modificado', lider_id: 'some-id' })
      });
      console.log("Status:", patchRes.status);
      console.log("Body:", await patchRes.text());
    }

    console.log("\n--- POST AREA ---");
    const postRes = await fetch(`http://localhost:3000/api/erp/v1/areas`, {
        method: 'POST',
        headers: { 
          'Authorization': 'Bearer ' + access_token,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ nombre: 'Area Nueva 2', lider_id: 'some-id', sede_id: 'some-id' })
    });
    console.log("Status:", postRes.status);
    console.log("Body:", await postRes.text());

  } catch (err) {
    console.error(err);
  }
}
test();
