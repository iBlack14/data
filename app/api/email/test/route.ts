import { getChatGPTUser } from '../../../chatgpt-auth';
import { getDb } from '../../../../db';
import { records } from '../../../../db/schema';
import { and, eq } from 'drizzle-orm';

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'Inicia sesión.' }, { status: 401 });

  try {
    const { id, host, port, secure, user: smtpUser, pass }: any = await request.json();

    if (!host || !smtpUser) {
      return Response.json({ error: 'Host y usuario son obligatorios.' }, { status: 400 });
    }

    let finalPass = pass ? String(pass) : '';
    // Si no envió pass en el form de prueba, buscar la contraseña guardada en la BD
    if (!finalPass) {
      const db = getDb();
      const accounts = await db
        .select()
        .from(records)
        .where(and(eq(records.owner, user.userId), eq(records.kind, 'email_account')));
      for (const a of accounts) {
        if (id && (a.id === id || a.id.endsWith(id))) {
          const parsed = JSON.parse(a.data);
          if (parsed.pass) { finalPass = parsed.pass; break; }
        }
        const parsed = JSON.parse(a.data);
        if (parsed.user === smtpUser && parsed.host === host && parsed.pass) {
          finalPass = parsed.pass;
          break;
        }
      }
    }

    if (!finalPass) {
      return Response.json({ error: 'Ingresa la contraseña para probar la conexión.' }, { status: 400 });
    }

    const bridgeRes = await fetch('http://127.0.0.1:5180/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host,
        port: Number(port) || 465,
        secure: secure !== false,
        user: smtpUser,
        pass: finalPass
      })
    });

    const bridgeData: any = await bridgeRes.json();
    if (!bridgeRes.ok) {
      return Response.json({ error: bridgeData.error || 'Error probando conexión SMTP' }, { status: 400 });
    }

    return Response.json({ ok: true, message: bridgeData.message || '¡Conexión SMTP exitosa!' });
  } catch (e: any) {
    return Response.json({ error: 'Error de conexión SMTP: ' + (e.message || 'Verifica host, puerto o contraseña.') }, { status: 400 });
  }
}
