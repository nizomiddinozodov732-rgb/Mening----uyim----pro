/**
 * House Shop — Next.js uchun maxsus (custom) server.
 *
 * Nega kerak:
 *  1. `next start` / `next dev` ning `rewrites` mexanizmi WebSocket "upgrade"
 *     so'rovlarini uzatmaydi — shu sababli brauzer `/ws/chat/` ga ulana olmaydi
 *     va video/ovozli qo'ng'iroq signalizatsiyasi umuman ishlamaydi.
 *  2. Next.js rewrite paytida yo'l oxiridagi `/` ni olib tashlaydi, Django esa
 *     APPEND_SLASH bilan uni qayta qo'shib (301) cheksiz redirect halqasi hosil
 *     qilardi — natijada production'da API so'rovlari ishlamaydi.
 *
 * Yechim: bu server Next.js'ni sahifalar uchun ishlatadi, backend yo'llarini
 * (`/api`, `/media`, `/static`, `/django-admin`) va `/ws/*` WebSocket
 * ulanishlarini esa to'g'ridan-to'g'ri Django (daphne) serveriga proxy qiladi —
 * yo'lni o'zgartirmasdan. Natijada dev va production'da ham hammasi bitta
 * domenda to'g'ri ishlaydi.
 */
/* eslint-disable @typescript-eslint/no-require-imports -- bu CommonJS Node entry fayli */
const http = require('http');
const next = require('next');
const httpProxy = require('next/dist/compiled/http-proxy');

// Dev/production rejimini aniqlash: `node server.js --dev` yoki NODE_ENV=development
const dev =
  process.argv.includes('--dev') || process.env.NODE_ENV === 'development';
if (!dev) {
  // `next start` muhiti uchun muhim
  process.env.NODE_ENV = 'production';
}

const hostname = process.env.BIND_HOST || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);
const backend = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

// Django'ga proxy qilinadigan HTTP yo'l prefikslari
const BACKEND_PREFIXES = ['/api', '/media', '/static', '/django-admin'];

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Django (daphne) serveriga proxy — HTTP va WebSocket uchun bir xil
const proxy = httpProxy.createProxyServer({
  target: backend,
  ws: true,
  xfwd: true,
  changeOrigin: true,
});

proxy.on('error', (err, _req, res) => {
  console.error('[proxy] xatolik:', err && err.message ? err.message : err);
  if (res && typeof res.writeHead === 'function') {
    // HTTP javob
    try {
      res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Backend (Django) mavjud emas');
    } catch {
      /* e'tiborsiz */
    }
  } else if (res && res.destroy) {
    // WebSocket soket
    res.destroy();
  }
});

function pathOf(url) {
  return (url || '').split('?')[0];
}

function isBackendHttpPath(url) {
  const path = pathOf(url);
  return BACKEND_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

function isWsPath(url) {
  const path = pathOf(url);
  return path === '/ws' || path.startsWith('/ws/');
}

app.prepare().then(() => {
  // upgradeHandler faqat `prepare()`dan keyin mavjud bo'ladi (production'da HMR yo'q)
  let upgradeHandler = null;
  try {
    upgradeHandler = app.getUpgradeHandler();
  } catch (e) {
    console.warn('[server] Next.js upgrade handler mavjud emas:', e && e.message);
  }

  const server = http.createServer((req, res) => {
    if (isBackendHttpPath(req.url)) {
      proxy.web(req, res);
      return;
    }
    handle(req, res);
  });

  server.on('upgrade', (req, socket, head) => {
    if (isWsPath(req.url)) {
      // Qo'ng'iroq signalizatsiyasi — Django Channels
      proxy.ws(req, socket, head);
      return;
    }
    // Boshqa upgrade'lar (Next.js HMR) — Next.js'ga
    if (upgradeHandler) {
      upgradeHandler(req, socket, head);
    } else {
      socket.destroy();
    }
  });

  server.listen(port, hostname, () => {
    console.log(
      `> House Shop frontend tayyor: http://${hostname}:${port} (${dev ? 'dev' : 'production'})`
    );
    console.log(`> HTTP  ${BACKEND_PREFIXES.join(', ')} -> ${backend}`);
    console.log(`> WS    /ws/* -> ${backend}`);
  });
});
