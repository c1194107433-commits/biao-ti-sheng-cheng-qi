const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const handler = require('./api/generate');
// 仅在用户启动服务时读取配置，绝不打印配置内容。
try {
  const env = fs.readFileSync(path.join(__dirname, 'local.env'), 'utf8');
  for (const line of env.split(/\r?\n/)) {
    const match = line.match(/^\s*(DIFY_API_BASE|DIFY_API_KEY)\s*=(.*)$/);
    if (match) process.env[match[1]] = match[2].trim();
  }
} catch { console.error('未能加载本地配置，请检查 local.env 是否存在。'); process.exit(1); }
http.createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/api/generate') {
    let body = ''; let size = 0;
    try {
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 16384) { res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ error: '提交内容过长，请缩短后重试。' })); return; }
        body += chunk;
      }
      req.body = body;
      await handler(req, res);
    } catch { if (!res.writableEnded) { res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ error: '请求失败，请再试一次。' })); } }
    return;
  }
  // 精确白名单，配置和后端源码均不可下载。
  if ((req.method === 'GET' || req.method === 'HEAD') && (pathname === '/' || pathname === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(path.join(__dirname, 'index.html')).pipe(res); return;
  }
  res.writeHead(404); res.end('Not found');
}).listen(3000, '127.0.0.1', () => console.log('已启动：http://localhost:3000'));
