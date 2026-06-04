const http = require('http');

async function testAuth() {
  try {
    console.log('[1] Logging in...');
    const loginRes = await fetch('http://localhost:3000/api/erp/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: "admin", password: "Admin123*" })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error('Login failed: ' + JSON.stringify(loginData));

    const token = loginData.access_token;
    console.log('[2] Token obtained successfully');
    
    // Decode token payload
    const payloadBase64 = token.split('.')[1];
    const decodedPayload = Buffer.from(payloadBase64, 'base64').toString('utf-8');
    console.log('[2.1] Decoded Token Payload:', decodedPayload);

    console.log('[3] Fetching protected endpoint /users...');
    const usersRes = await fetch('http://localhost:3000/api/erp/v1/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const usersData = await usersRes.json();
    console.log('[4] Protected Endpoint Response Status:', usersRes.status);
    console.log('[5] Body Response:', JSON.stringify(usersData).substring(0, 100));

    // Also try /areas which is used by detectLeaderState
    console.log('[6] Fetching protected endpoint /areas...');
    const areasRes = await fetch('http://localhost:3000/api/erp/v1/areas', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('[7] Protected Endpoint /areas Status:', areasRes.status);
    
  } catch (err) {
    console.error('Test Error:', err);
  }
}

testAuth();
