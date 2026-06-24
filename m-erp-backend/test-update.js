const http = require('http');

const loginOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/erp/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(loginOptions, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const token = JSON.parse(data).access_token;
    
    http.request('http://localhost:3000/api/erp/v1/areas', { headers: { 'Authorization': 'Bearer ' + token } }, (rArea) => {
      let dArea = '';
      rArea.on('data', c => dArea += c);
      rArea.on('end', () => {
        const areas = JSON.parse(dArea);
        const areaId = areas[0]?.id; // Get a REAL area ID
        
        http.request('http://localhost:3000/api/erp/v1/ambientes/estado', { headers: { 'Authorization': 'Bearer ' + token } }, (res2) => {
          let data2 = '';
          res2.on('data', chunk => data2 += chunk);
          res2.on('end', () => {
            const ambs = JSON.parse(data2);
            const amb = ambs.find(a => a.nombre === 'Y29') || ambs[0];
            
            if (amb && areaId) {
              const payload = JSON.stringify({
                nombre: amb.nombre,
                capacidad: amb.capacidad,
                area_id: areaId
              });
              
              const patchOptions = {
                hostname: 'localhost',
                port: 3000,
                path: '/api/erp/v1/ambientes/' + amb.id,
                method: 'PATCH',
                headers: {
                  'Authorization': 'Bearer ' + token,
                  'Content-Type': 'application/json',
                  'Content-Length': Buffer.byteLength(payload)
                }
              };
              
              const req3 = http.request(patchOptions, (res3) => {
                let data3 = '';
                res3.on('data', chunk => data3 += chunk);
                res3.on('end', () => {
                  console.log("PATCH STATUS:", res3.statusCode, data3);
                });
              });
              req3.write(payload);
              req3.end();
            }
          });
        }).end();
      });
    }).end();
  });
});

req.write(JSON.stringify({ username: 'admin', password: 'Admin123*' }));
req.end();
