import { getChatGPTUser } from '../../../chatgpt-auth';
import { getDb } from '../../../../db';
import { records } from '../../../../db/schema';
import { and, eq } from 'drizzle-orm';

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'Inicia sesión.' }, { status: 401 });

  const db = getDb();
  const rows = await db
    .select()
    .from(records)
    .where(and(eq(records.owner, user.userId), eq(records.kind, 'email_account')));

  return Response.json(
    rows.map(r => {
      const data = JSON.parse(r.data);
      // Omitir contraseña completa en listado por seguridad, o devolver máscara
      return {
        id: r.id,
        label: data.label || '',
        senderEmail: data.senderEmail || '',
        senderName: data.senderName || '',
        host: data.host || '',
        port: data.port || 465,
        secure: data.secure !== false,
        user: data.user || '',
        hasPassword: Boolean(data.pass),
        isDefault: Boolean(data.isDefault)
      };
    })
  );
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'Inicia sesión.' }, { status: 401 });

  try {
    const body: any = await request.json();
    const { id, label, senderEmail, senderName, host, port, secure, user: smtpUser, pass, isDefault } = body;

    if (!senderEmail || !host || !smtpUser) {
      return Response.json({ error: 'Correo, servidor SMTP y usuario son obligatorios.' }, { status: 400 });
    }

    const db = getDb();
    const accountId = id ? (id.startsWith(user.userId + ':') ? id : user.userId + ':' + id) : user.userId + ':email:' + crypto.randomUUID();

    // Si ya existe y no envió nueva pass, conservar la existente
    let existingPass = '';
    if (id) {
      const existing = await db
        .select()
        .from(records)
        .where(and(eq(records.id, accountId), eq(records.owner, user.userId)));
      if (existing.length) {
        existingPass = JSON.parse(existing[0].data).pass || '';
      }
    }

    const dataObj = {
      label: label || senderEmail,
      senderEmail,
      senderName: senderName || '',
      host,
      port: Number(port) || (secure ? 465 : 587),
      secure: secure !== false,
      user: smtpUser,
      pass: pass ? String(pass) : existingPass,
      isDefault: Boolean(isDefault)
    };

    // Si se marca como predeterminada, desmarcar las demás
    if (isDefault) {
      const allAccounts = await db
        .select()
        .from(records)
        .where(and(eq(records.owner, user.userId), eq(records.kind, 'email_account')));
      for (const acc of allAccounts) {
        if (acc.id !== accountId) {
          const parsed = JSON.parse(acc.data);
          parsed.isDefault = false;
          await db.update(records).set({ data: JSON.stringify(parsed) }).where(eq(records.id, acc.id));
        }
      }
    }

    await db
      .insert(records)
      .values({
        id: accountId,
        owner: user.userId,
        kind: 'email_account',
        data: JSON.stringify(dataObj),
        updated: new Date().toISOString()
      })
      .onConflictDoUpdate({
        target: records.id,
        set: { data: JSON.stringify(dataObj), updated: new Date().toISOString() },
        where: eq(records.owner, user.userId)
      });

    return Response.json({ ok: true, id: accountId });
  } catch (e: any) {
    return Response.json({ error: e.message || 'No se pudo guardar la cuenta.' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'Inicia sesión.' }, { status: 401 });

  try {
    const { id }: any = await request.json();
    const db = getDb();
    await db.delete(records).where(and(eq(records.id, id), eq(records.owner, user.userId)));
    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ error: e.message || 'No se pudo eliminar.' }, { status: 400 });
  }
}
