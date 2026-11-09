import { getChatGPTUser } from '../../../chatgpt-auth';
import { getDb } from '../../../../db';
import { records } from '../../../../db/schema';
import { and, eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'Inicia sesión.' }, { status: 401 });

  try {
    const { accountId, to, subject, message, companyId, html }: any = await request.json();

    if (!to || !subject || !message) {
      return Response.json({ error: 'Destinatario, asunto y mensaje son obligatorios.' }, { status: 400 });
    }

    const db = getDb();

    // Buscar la cuenta remitente
    let accountRow;
    if (accountId) {
      const rows = await db
        .select()
        .from(records)
        .where(and(eq(records.id, accountId), eq(records.owner, user.userId), eq(records.kind, 'email_account')));
      if (rows.length) accountRow = rows[0];
    }

    if (!accountRow) {
      // Buscar la cuenta predeterminada o la primera disponible
      const all = await db
        .select()
        .from(records)
        .where(and(eq(records.owner, user.userId), eq(records.kind, 'email_account')));
      if (!all.length) {
        return Response.json({ error: 'No tienes ninguna cuenta de correo configurada. Ve a Correos para añadir una.' }, { status: 400 });
      }
      accountRow = all.find(r => JSON.parse(r.data).isDefault) || all[0];
    }

    const account = JSON.parse(accountRow.data);
    if (!account.host || !account.user || !account.pass) {
      return Response.json({ error: 'La cuenta seleccionada no tiene credenciales completas.' }, { status: 400 });
    }

    const fromAddress = account.senderName ? `"${account.senderName}" <${account.senderEmail}>` : account.senderEmail;
    const cleanMessageText = message.replace(/\uFFFD/g, '').replace(/\uFE0F/g, '');
    const htmlBody = cleanMessageText
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');

    const bridgeRes = await fetch('http://127.0.0.1:5180/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: account.host,
        port: Number(account.port) || 465,
        secure: account.secure !== false,
        user: account.user,
        pass: account.pass,
        from: fromAddress,
        to,
        subject,
        text: message,
        html: html || `<div style="font-family:sans-serif;font-size:14px;color:#222;line-height:1.6;">${htmlBody}</div>`
      })
    });

    const bridgeData: any = await bridgeRes.json();
    if (!bridgeRes.ok) {
      return Response.json({ error: bridgeData.error || 'Error al enviar correo' }, { status: 400 });
    }

    // Si se vinculó a una empresa, actualizar su estado y notas
    if (companyId) {
      const compRows = await db
        .select()
        .from(records)
        .where(and(eq(records.id, companyId), eq(records.owner, user.userId)));
      if (compRows.length) {
        const comp = compRows[0];
        const compData = JSON.parse(comp.data);
        const today = new Date().toISOString().slice(0, 10);
        compData.lastContact = today;
        if (compData.stage === 'Nuevo') {
          compData.stage = 'Contactado';
        }
        compData.contactedEmail = true;
        const noteEntry = `[${today}] Correo enviado desde ${account.senderEmail}: "${subject}"`;
        compData.notes = compData.notes ? `${compData.notes}\n${noteEntry}` : noteEntry;

        await db
          .update(records)
          .set({ data: JSON.stringify(compData), updated: new Date().toISOString() })
          .where(eq(records.id, companyId));
      }
    }

    return Response.json({
      ok: true,
      messageId: bridgeData.messageId || 'sent',
      message: `Correo enviado exitosamente a ${to} desde ${account.senderEmail}.`
    });
  } catch (e: any) {
    return Response.json({ error: 'Error al enviar correo: ' + (e.message || 'Verifica la configuración SMTP.') }, { status: 400 });
  }
}
