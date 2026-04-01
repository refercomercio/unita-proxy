const http = require('http');

const TOTVS_HOST = '198.161.83.215';
const TOTVS_PORT = 8015;
const TOTVS_USER = 'REFER';
const TOTVS_PASS = '<SJIXdJt9w';
const PORT = process.env.PORT || 3001;
const AUTH = 'Basic ' + Buffer.from(TOTVS_USER + ':' + TOTVS_PASS).toString('base64');
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Content-Type': 'application/json' };

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
  const rawPath = url.pathname;

  console.log('Request:', rawPath + url.search);

  try {
    // Health check
    if (rawPath === '/health') {
      res.writeHead(200, CORS);
      res.end(JSON.stringify({ status: 'ok', ts: new Date().toISOString() }));
      return;
    }

    // Repassa qualquer rota para o TOTVS
    // /proxy/get_id/?EMP=01&ID=xxx -> /REST/ZWSSALDOS/get_id/?EMP=01&ID=xxx
    // /proxy/get_all/?EMP=01&... -> /REST/ZWSSALDOS/get_all/?EMP=01&...
    let totvsPath = rawPath.replace(/^\/proxy/, '');
    if (!totvsPath.startsWith('/REST/')) {
      totvsPath = '/REST/ZWSSALDOS' + totvsPath;
    }
    totvsPath += url.search;

    console.log('Chamando TOTVS:', totvsPath);
    const result = await chamarTotvs(totvsPath);
    res.writeHead(result.status, CORS);
    res.end(result.body);

  } catch(e) {
    console.error('Erro:', e.message);
    res.writeHead(502, CORS);
    res.end(JSON.stringify({ erro: e.message }));
  }

}).listen(PORT, () => console.log('Proxy Unita rodando na porta ' + PORT));
