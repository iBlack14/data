import { getChatGPTUser } from '../../../chatgpt-auth';

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'Inicia sesión.' }, { status: 401 });

  try {
    const res = await fetch('http://127.0.0.1:5181/status');
    const data = await res.json();
    return Response.json(data);
  } catch (e: any) {
    return Response.json({ connected: false, error: 'Servicio WhatsApp en reposo / no iniciado.' });
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'Inicia sesión.' }, { status: 401 });

  try {
    const body: any = await request.json();
    const { action, phone } = body;

    if (action === 'pairingCode') {
      const res = await fetch('http://127.0.0.1:5181/pairing-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      return Response.json(data);
    }

    const endpoint = action === 'disconnect' ? 'disconnect' : 'connect';
    const res = await fetch(`http://127.0.0.1:5181/${endpoint}`, { method: 'POST' });
    const data = await res.json();
    return Response.json(data);
  } catch (e: any) {
    return Response.json({ error: e.message || 'Error al conectar con WhatsApp.' }, { status: 500 });
  }
}

