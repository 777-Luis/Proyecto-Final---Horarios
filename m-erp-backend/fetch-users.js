const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/erp/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const token = JSON.parse(data).access_token;
    
    // Fetch users
    const getOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/erp/v1/users',
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
    };
    http.request(getOptions, getRes => {
        let udata = '';
        getRes.on('data', chunk => udata += chunk);
        getRes.on('end', () => console.log(JSON.stringify(JSON.parse(udata).slice(0,2), null, 2)));
    }).end();
  });
});

req.write(JSON.stringify({ username: 'admin', password: 'Admin123*' }));
req.end();
