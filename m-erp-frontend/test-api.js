const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/erp/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const token = JSON.parse(data).token;
    
    const req2 = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/erp/v1/horarios/registro-clases?fecha=2026-05-25',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    }, (res2) => {
      let data2 = '';
      res2.on('data', (chunk) => data2 += chunk);
      res2.on('end', () => console.log('RESPONSE:', data2));
    });
    req2.end();
  });
});

req.write(JSON.stringify({ documento: '123456', password: 'password' })); // Assuming admin credentials
req.end();
