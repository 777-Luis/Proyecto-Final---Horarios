async function test() {
  try {
    const adminAuth = await fetch('http://localhost:3000/api/erp/v1/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Admin123*' })
    }).then(r => r.json());

    if (!adminAuth.access_token) {
        console.error("No admin token!"); return;
    }
    const token = adminAuth.access_token;

    // Obtener municipio id de Neiva
    const munRes = await fetch('http://localhost:3000/api/erp/v1/municipios', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());
    const neiva = munRes.find(m => m.nombre === 'Neiva');
    if(!neiva) { console.error("No municipality found!"); return; }

    const carlosPayload = {
      nombre: "Carlos Mendoza", tipo_documento: "CC", numero_documento: "987654321",
      correo: "carlos.mendoza@sena.edu.co", password: "Instructor123*", 
      rol_nombre: "Instructor", genero: "Masculino", municipio_id: neiva.id
    };
    const juanPayload = {
      nombre: "Juan Perez", tipo_documento: "CC", numero_documento: "111222333",
      correo: "juan.perez@sena.edu.co", password: "Aprendiz123*", 
      rol_nombre: "Aprendiz", genero: "Masculino", municipio_id: neiva.id
    };

    console.log("Creating Carlos...");
    const resC = await fetch('http://localhost:3000/api/erp/v1/users', {
      method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(carlosPayload)
    });
    console.log("Status Carlos: ", resC.status, await resC.text());

    console.log("Creating Juan...");
    const resJ = await fetch('http://localhost:3000/api/erp/v1/users', {
      method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(juanPayload)
    });
    console.log("Status Juan: ", resJ.status, await resJ.text());

    console.log("Testing Login Carlos...");
    const loginC = await fetch('http://localhost:3000/api/erp/v1/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'carlos.mendoza', password: 'Instructor123*' })
    });
    console.log("Login Carlos: ", loginC.status);

    console.log("Testing Login Juan...");
    const loginJ = await fetch('http://localhost:3000/api/erp/v1/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'juan.perez', password: 'Aprendiz123*' })
    });
    console.log("Login Juan: ", loginJ.status);

  } catch(e) { console.error(e); }
}
test();
