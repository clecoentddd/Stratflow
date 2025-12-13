
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 9005,
  path: '/api/kanban/data?type=items',
  method: 'GET',
  headers: {
    'Cookie': 'userId=chris@socraft.fr' // Simulate logged in user
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    try {
        const json = JSON.parse(data);
        console.log(`Items count: ${json.elements.length}`);
        console.log(`Columns: ${json.columns.map(c => c.title).join(', ')}`);
    } catch (e) {
        console.log('Response is not JSON:', data.substring(0, 100));
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
