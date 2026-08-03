const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const PORT = 8099;
const PUBLIC = path.join(__dirname, 'public');
const TOKEN = process.env.SUPERVISOR_TOKEN;
const HA = 'http://supervisor/core/api';
const HA_WS = 'ws://supervisor/core/websocket';

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

async function body(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
}

async function ha(pathname, options = {}) {
  if (!TOKEN) throw new Error('SUPERVISOR_TOKEN non disponibile');
  const response = await fetch(`${HA}${pathname}`, {
    ...options,
    headers: {
      authorization: `Bearer ${TOKEN}`,
      'content-type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || `Home Assistant: ${response.status}`);
  return text ? JSON.parse(text) : {};
}

function haWs(command) {
  return new Promise((resolve, reject) => {
    if (!TOKEN) return reject(new Error('SUPERVISOR_TOKEN non disponibile'));
    const socket = new WebSocket(HA_WS);
    const timer = setTimeout(() => { socket.terminate(); reject(new Error('Timeout configurazione dashboard')); }, 12000);
    const finish = (error, result) => {
      clearTimeout(timer);
      socket.close();
      error ? reject(error) : resolve(result);
    };
    socket.on('message', raw => {
      const message = JSON.parse(raw.toString());
      if (message.type === 'auth_required') socket.send(JSON.stringify({ type: 'auth', access_token: TOKEN }));
      else if (message.type === 'auth_invalid') finish(new Error('Autenticazione Home Assistant non riuscita'));
      else if (message.type === 'auth_ok') socket.send(JSON.stringify({ id: 1, ...command }));
      else if (message.id === 1 && message.type === 'result') {
        message.success ? finish(null, message.result) : finish(new Error(message.error?.message || 'Dashboard non disponibile'));
      }
    });
    socket.on('error', error => finish(error));
  });
}

function entityIds(value, found = new Set()) {
  if (typeof value === 'string' && /^[a-z_]+\.[a-zA-Z0-9_]+$/.test(value)) found.add(value);
  else if (Array.isArray(value)) value.forEach(item => entityIds(item, found));
  else if (value && typeof value === 'object') Object.values(value).forEach(item => entityIds(item, found));
  return found;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const route = url.pathname.replace(/^\/api\//, '');

  try {
    if (url.pathname === '/api/states' && req.method === 'GET') {
      return json(res, 200, await ha('/states'));
    }
    if (url.pathname === '/api/config' && req.method === 'GET') {
      return json(res, 200, await ha('/config'));
    }
    if (url.pathname === '/api/lovelace' && req.method === 'GET') {
      const dashboard = url.searchParams.get('dashboard') || 'lovelace';
      const viewPath = url.searchParams.get('view') || '';
      const config = await haWs({ type: 'lovelace/config', url_path: dashboard });
      const view = (config.views || []).find(item => item.path === viewPath || String(item.title || '').toLowerCase() === viewPath.toLowerCase());
      const source = view || config;
      return json(res, 200, { dashboard, view: viewPath, title: view?.title || 'HOME', entity_ids: [...entityIds(source)] });
    }
    if (url.pathname === '/api/service' && req.method === 'POST') {
      const data = await body(req);
      if (!data.domain || !data.service) return json(res, 400, { error: 'Comando non valido' });
      const result = await ha(`/services/${encodeURIComponent(data.domain)}/${encodeURIComponent(data.service)}`, {
        method: 'POST', body: JSON.stringify(data.data || {})
      });
      return json(res, 200, result);
    }
    if (route.startsWith('history/') && req.method === 'GET') {
      const entity = encodeURIComponent(route.slice(8));
      const start = encodeURIComponent(url.searchParams.get('start') || new Date(Date.now() - 86400000).toISOString());
      return json(res, 200, await ha(`/history/period/${start}?filter_entity_id=${entity}&minimal_response`));
    }
  } catch (error) {
    return json(res, 502, { error: error.message });
  }

  let filePath = url.pathname === '/' ? path.join(PUBLIC, 'index.html') : path.join(PUBLIC, url.pathname);
  if (!filePath.startsWith(PUBLIC)) return json(res, 403, { error: 'Accesso negato' });
  fs.stat(filePath, (error, stat) => {
    if (error || !stat.isFile()) filePath = path.join(PUBLIC, 'index.html');
    fs.readFile(filePath, (readError, data) => {
      if (readError) return json(res, 404, { error: 'File non trovato' });
      res.writeHead(200, { 'content-type': mime[path.extname(filePath)] || 'application/octet-stream' });
      res.end(data);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => console.log(`FormaViva Home attivo sulla porta ${PORT}`));
