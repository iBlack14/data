import http from 'node:http';
import nodemailer from 'nodemailer';

const PORT = 5180;
const HOST = '127.0.0.1';

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);

  if (url.pathname === '/health' && req.method === 'GET') {
    return sendJson(res, 200, { ok: true, status: 'smtp-bridge-active' });
  }

  if (url.pathname === '/test' && req.method === 'POST') {
    try {
      const { host, port, secure, user, pass } = await parseBody(req);
      if (!host || !user || !pass) {
        return sendJson(res, 400, { error: 'Host, usuario y contraseña son requeridos.' });
      }

      const transporter = nodemailer.createTransport({
        host,
        port: Number(port) || 465,
        secure: secure !== false,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 12000,
        greetingTimeout: 10000,
        socketTimeout: 15000
      });

      await transporter.verify();
      return sendJson(res, 200, { ok: true, message: '¡Conexión SMTP exitosa! El servidor aceptó las credenciales.' });
    } catch (err) {
      console.error('[SMTP Bridge Test Error]:', err.message);
      return sendJson(res, 400, { error: 'Error de conexión SMTP: ' + (err.message || 'Verifica datos de conexión.') });
    }
  }

  if (url.pathname === '/send' && req.method === 'POST') {
    try {
      const { host, port, secure, user, pass, from, to, subject, text, html } = await parseBody(req);
      if (!host || !user || !pass || !to || !subject) {
        return sendJson(res, 400, { error: 'Faltan parámetros obligatorios para el envío.' });
      }

      const transporter = nodemailer.createTransport({
        host,
        port: Number(port) || 465,
        secure: secure !== false,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 15000,
        greetingTimeout: 12000,
        socketTimeout: 20000
      });

      const info = await transporter.sendMail({
        from: from || user,
        to,
        subject,
        text: text || '',
        html: html || undefined
      });

      console.log(`[SMTP Bridge Sent]: Message to ${to} id: ${info.messageId}`);
      return sendJson(res, 200, { ok: true, messageId: info.messageId, message: `Correo enviado a ${to}` });
    } catch (err) {
      console.error('[SMTP Bridge Send Error]:', err.message);
      return sendJson(res, 400, { error: 'Error al enviar correo: ' + (err.message || 'No se pudo enviar.') });
    }
  }

  return sendJson(res, 404, { error: 'Not found' });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`[SMTP Bridge] Already running on http://${HOST}:${PORT}`);
  } else {
    console.error('[SMTP Bridge Error]:', err);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`SMTP Service Bridge running on http://${HOST}:${PORT}`);
});
