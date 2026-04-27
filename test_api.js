const http = require('http');

function post(url, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(d) }));
    });
    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

function get(url, token) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(d) }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function test() {
  try {
    const loginRes = await post('http://localhost:3001/api/auth/login', {
      email: 'admin@chadwickswitchboards.com.au',
      password: 'Developer@2k26!'
    });
    if (loginRes.status !== 200) throw new Error('Login failed: ' + JSON.stringify(loginRes.data));
    const token = loginRes.data.token;
    console.log('Login successful');

    const ncrRes = await get('http://localhost:3001/api/ncrs/714eb5cc-dc38-4e2b-99d0-7f0041ee8aa2', token);
    if (ncrRes.status !== 200) throw new Error('NCR fetch failed: ' + JSON.stringify(ncrRes.data));
    console.log('NCR detail fetch successful:', ncrRes.data.autoId);
  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

test();
