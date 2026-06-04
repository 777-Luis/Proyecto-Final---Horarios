async function test() {
  try {
    const login = await fetch('http://localhost:3000/api/erp/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Admin123*' })
    });
    const { access_token } = await login.json();
    
    const res = await fetch('http://localhost:3000/api/erp/v1/programas', {
      headers: { 'Authorization': 'Bearer ' + access_token }
    });
    const data = await res.json();
    console.log("Programas:", JSON.stringify(data, null, 2));

  } catch (err) {
    console.error(err);
  }
}
test();
