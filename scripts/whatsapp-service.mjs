import http from 'node:http';
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 5181;
const HOST = '127.0.0.1';
const SESSION_DIR = path.resolve('.whatsapp_session');

let sock = null;
let currentQR = null;
let currentPairingCode = null;
let pairingPhone = null;
let isConnected = false;
let isConnecting = false;
let connectedPhone = null;

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

async function initBaileys(pairingPhoneNumber = null) {
  if (sock || isConnected) return;
  isConnecting = true;
  currentQR = null;
  currentPairingCode = null;
  pairingPhone = pairingPhoneNumber;

  try {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

    sock = makeWASocket({
      auth: state,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      browser: ['Ubuntu', 'Chrome', '20.0.04']
    });

    sock.ev.on('creds.update', saveCreds);

    if (pairingPhoneNumber && !sock.authState.creds.registered) {
      setTimeout(async () => {
        try {
          if (sock && !sock.authState.creds.registered) {
            let code = await sock.requestPairingCode(pairingPhoneNumber);
            code = code?.match(/.{1,4}/g)?.join('-') || code;
            currentPairingCode = code;
            console.log(`[WhatsApp Pairing Code Generated]: ${code} for +${pairingPhoneNumber}`);
          }
        } catch (err) {
          console.error('[WhatsApp Pairing Code Error]:', err.message);
        }
      }, 3000);
    }

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr && !pairingPhone) {
        try {
          currentQR = await QRCode.toDataURL(qr);
        } catch (err) {
          console.error('[WhatsApp QR Error]:', err);
        }
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log('[WhatsApp Connection Closed] Status:', statusCode, 'Reconnect:', shouldReconnect);

        isConnected = false;
        connectedPhone = null;
        isConnecting = false;
        currentQR = null;
        currentPairingCode = null;
        pairingPhone = null;
        sock = null;

        if (statusCode === DisconnectReason.loggedOut) {
          // Sesión cerrada por el usuario en el celular: limpiar credenciales para no gastar recursos
          cleanupSessionFiles();
        }
      } else if (connection === 'open') {
        isConnected = true;
        isConnecting = false;
        currentQR = null;
        currentPairingCode = null;
        pairingPhone = null;
        connectedPhone = sock?.user?.id ? sock.user.id.split(':')[0] : 'Conectado';
        console.log(`[WhatsApp Connected]: +${connectedPhone}`);
      }
    });
  } catch (err) {
    console.error('[WhatsApp Init Error]:', err);
    isConnecting = false;
    sock = null;
  }
}

function cleanupSessionFiles() {
  try {
    if (fs.existsSync(SESSION_DIR)) {
      fs.rmSync(SESSION_DIR, { recursive: true, force: true });
    }
  } catch (e) {
    console.error('Error removing session dir:', e.message);
  }
}

async function disconnectBaileys() {
  try {
    if (sock) {
      sock.ev.removeAllListeners();
      sock.end(new Error('Manual disconnect'));
      sock = null;
    }
  } catch (e) {
    console.error('Error ending socket:', e.message);
  }
  isConnected = false;
  isConnecting = false;
  currentQR = null;
  currentPairingCode = null;
  pairingPhone = null;
  connectedPhone = null;
  cleanupSessionFiles();
}

// Comprobar si ya existe sesión previa guardada al arrancar
if (fs.existsSync(SESSION_DIR) && fs.readdirSync(SESSION_DIR).length > 0) {
  console.log('[WhatsApp Bridge] Existing session found, resuming connection...');
  initBaileys();
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

  if (url.pathname === '/status' && req.method === 'GET') {
    return sendJson(res, 200, {
      connected: isConnected,
      connecting: isConnecting,
      phone: connectedPhone,
      qr: currentQR,
      pairingCode: currentPairingCode
    });
  }

  if (url.pathname === '/pairing-code' && req.method === 'POST') {
    const { phone } = await parseBody(req);
    if (!phone) {
      return sendJson(res, 400, { error: 'Ingresa un número de teléfono.' });
    }
    let clean = String(phone).replace(/\D/g, '');
    if (clean.length === 9) {
      clean = '51' + clean;
    }

    if (isConnected) {
      return sendJson(res, 200, { connected: true, phone: connectedPhone });
    }

    if (sock) {
      await disconnectBaileys();
    }

    await initBaileys(clean);

    let wait = 0;
    while (!currentPairingCode && !isConnected && wait < 24) {
      await new Promise(r => setTimeout(r, 250));
      wait++;
    }

    return sendJson(res, 200, {
      connected: isConnected,
      connecting: isConnecting,
      code: currentPairingCode,
      phone: clean
    });
  }

  if (url.pathname === '/connect' && req.method === 'POST') {
    if (!isConnected && !sock) {
      await initBaileys();
    }
    // Esperar hasta 3.5 segundos para que Baileys emita el primer QR
    let waitCount = 0;
    while (!currentQR && !isConnected && waitCount < 14) {
      await new Promise(r => setTimeout(r, 250));
      waitCount++;
    }

    return sendJson(res, 200, {
      connected: isConnected,
      connecting: isConnecting,
      phone: connectedPhone,
      qr: currentQR,
      pairingCode: currentPairingCode
    });
  }

  if (url.pathname === '/disconnect' && req.method === 'POST') {
    await disconnectBaileys();
    return sendJson(res, 200, {
      ok: true,
      message: 'WhatsApp desconectado. Recursos liberados.',
      connected: false
    });
  }

  if (url.pathname === '/send' && req.method === 'POST') {
    if (!isConnected || !sock) {
      return sendJson(res, 400, {
        error: 'WhatsApp no está vinculado. Escanea el código QR primero o usa el botón de apertura directa.'
      });
    }

    try {
      const { phone, message } = await parseBody(req);
      if (!phone || !message) {
        return sendJson(res, 400, { error: 'Teléfono y mensaje son obligatorios.' });
      }

      // Normalizar número telefónico
      // Ejemplos: "+51 901 157 183" -> "51901157183"
      let cleanDigits = String(phone).replace(/\D/g, '');
      // Si el número en Perú tiene 9 dígitos sin código de país, agregar 51
      if (cleanDigits.length === 9) {
        cleanDigits = '51' + cleanDigits;
      }
      const jid = `${cleanDigits}@s.whatsapp.net`;

      const result = await sock.sendMessage(jid, { text: message });
      console.log(`[WhatsApp Sent]: to ${jid} id: ${result?.key?.id}`);

      return sendJson(res, 200, {
        ok: true,
        messageId: result?.key?.id,
        message: `Mensaje de WhatsApp enviado a +${cleanDigits}`
      });
    } catch (err) {
      console.error('[WhatsApp Send Error]:', err.message);
      return sendJson(res, 400, {
        error: 'Error al enviar por WhatsApp: ' + (err.message || 'Error de envío.')
      });
    }
  }

  return sendJson(res, 404, { error: 'Not found' });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`[WhatsApp Bridge] Already running on http://${HOST}:${PORT}`);
  } else {
    console.error('[WhatsApp Bridge Error]:', err);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`WhatsApp Service Bridge running on http://${HOST}:${PORT}`);
});

