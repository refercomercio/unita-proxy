const http = require('http');

const TOTVS_HOST = '198.161.83.215';
const TOTVS_PORT = 8015;
const TOTVS_USER = 'REFER';
const TOTVS_PASS = '<SJIXdJt9w';
const PORT = process.env.PORT || 3001;

const AUTH = 'Basic ' + Buffer.from(TOTVS_USER + ':' + TOTVS_PASS).toString('base64');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

function chamarTotvs(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: TOTVS_HOST, port: TOTVS_PORT, path, method: 'GET',
      headers: { 'Authorization': AUTH, 'Accept': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.setTimeout(25000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.on('error', reject);
    req.end();
  });
}

http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); res.end(); return; }
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname.replace(/\/proxy/, '');
  try {
    if (p === '/health' || p === '/health/') {
      res.writeHead(200, CORS);
      res.end(JSON.stringify({ status: 'ok', ts: new Date().toISOString() }));
      return;
    }
    const query = url.search;
    const totvs = await chamarTotvs('/REST/ZWSSALDOS' + p + query);
    res.writeHead(totvs.status, CORS);
    res.end(totvs.body);
  } catch(e) {
    res.writeHead(502, CORS);
    res.end(JSON.stringify({ erro: e.message }));
  }
}).listen(PORT, () => console.log('Proxy rodando na porta ' + PORT));
