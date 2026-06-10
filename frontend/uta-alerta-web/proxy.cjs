const http = require('http');
const httpProxy = require('http-proxy');

// Crear el servidor proxy con soporte para WebSockets
const proxy = httpProxy.createProxyServer({
  ws: true
});

// Manejo de errores para evitar que el proxy se caiga si un backend está apagado
proxy.on('error', (err, req, res) => {
  console.error('Error en el proxy:', err.message);
  if (res && res.writeHead) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Error de conexion con el backend local.');
  }
});

// Eliminar los headers CORS del backend para que el proxy tenga el control total
proxy.on('proxyRes', (proxyRes, req, res) => {
  delete proxyRes.headers['access-control-allow-origin'];
  delete proxyRes.headers['access-control-allow-credentials'];
  delete proxyRes.headers['access-control-allow-methods'];
  delete proxyRes.headers['access-control-allow-headers'];
});

// Puertos locales de los microservicios
const TARGETS = {
  auth: 'http://127.0.0.1:5007',
  incident: 'http://127.0.0.1:5008',
  signalr: 'http://127.0.0.1:5009'
};

const server = http.createServer((req, res) => {
  // Configurar CORS dinámico (necesario para SignalR)
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, ngrok-skip-browser-warning, Bypass-Tunnel-Reminder, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Enrutar según la URL
  if (req.url.startsWith('/api/auth')) {
    proxy.web(req, res, { target: TARGETS.auth });
  } else if (req.url.startsWith('/api/incidents') || req.url.startsWith('/api/zonas') || req.url.startsWith('/api/cameras')) {
    proxy.web(req, res, { target: TARGETS.incident });
  } else if (req.url.startsWith('/hubs/incident') || req.url.startsWith('/negotiate')) {
    proxy.web(req, res, { target: TARGETS.signalr });
  } else if (req.url.startsWith('/api/grupos')) {
    // GruposController vive en NotificationService (5009)
    proxy.web(req, res, { target: TARGETS.signalr }); 
  } else if (req.url.startsWith('/api/usuarios')) {
    proxy.web(req, res, { target: TARGETS.auth }); 
  } else {
    // Cualquier otra cosa a Incidentes por defecto
    proxy.web(req, res, { target: TARGETS.incident });
  }
});

// Manejo de WebSockets para SignalR
server.on('upgrade', (req, socket, head) => {
  if (req.url.startsWith('/hubs/incident')) {
    proxy.ws(req, socket, head, { target: TARGETS.signalr });
  }
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 SERVIDOR PROXY UNIFICADO CORRIENDO EN EL PUERTO ${PORT}`);
  console.log(`======================================================`);
  console.log(`-> Redirigiendo /api/auth y /api/usuarios al puerto 5007`);
  console.log(`-> Redirigiendo WebSockets /hubs al puerto 5009`);
  console.log(`-> Redirigiendo el resto de /api/... al puerto 5008`);
  console.log(`\n¡AHORA SOLO NECESITAS 1 TERMINAL PARA NGROK!`);
  console.log(`Ejecuta este comando: ngrok http 5000`);
});
