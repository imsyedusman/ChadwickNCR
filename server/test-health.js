
const http = require('http');

http.get('http://localhost:3001/health', (res) => {
  console.log('Status:', res.statusCode);
  res.on('data', (d) => {
    console.log('Body:', d.toString());
  });
}).on('error', (e) => {
  console.error('Error:', e.message);
});
