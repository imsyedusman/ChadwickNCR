
const http = require('http');

const endpoints = [
  '/api/ncrs',
  '/api/ncrs/capa-actions',
  '/api/ncrs/audit-logs'
];

async function test() {
  for (const endpoint of endpoints) {
    console.log(`Testing ${endpoint}...`);
    // Note: This will likely fail with 401 because of auth middleware
    // but we can check if it responds with 401 instead of crashing
    http.get(`http://localhost:3001${endpoint}`, (res) => {
      console.log(`  Status for ${endpoint}:`, res.statusCode);
    }).on('error', (e) => {
      console.error(`  Error for ${endpoint}:`, e.message);
    });
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

test();
