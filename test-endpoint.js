async function test() {
  try {
    const login = await fetch('http://localhost:3000/api/erp/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Admin123*' })
    });
    const { access_token } = await login.json();

    const res = await fetch('http://localhost:3000/api/erp/v1/users?role=Instructor', {
      headers: { 'Authorization': 'Bearer ' + access_token }
    });
    
    const data = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", data);
  } catch (err) {
    console.error(err);
  }
}
test();
