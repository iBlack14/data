import { getChatGPTUser } from '../../../chatgpt-auth';
import { getDb } from '../../../../db';
import { records } from '../../../../db/schema';
import { and, eq } from 'drizzle-orm';

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'Inicia sesión.' }, { status: 401 });

  try {
    const { companyId, phone, message }: any = await request.json();

    if (!phone || !message) {
      return Response.json({ error: 'Teléfono y mensaje son obligatorios.' }, { status: 400 });
    }

    const bridgeRes = await fetch('http://127.0.0.1:5181/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message })
    });

    const bridgeData: any = await bridgeRes.json();
    if (!bridgeRes.ok) {
      return Response.json({ error: bridgeData.error || 'Error al enviar por WhatsApp' }, { status: 400 });
    }

    // Actualizar empresa a 'Contactado'
    if (companyId) {
      const db = getDb();
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
        compData.contactedViaWhatsApp = true;
        compData.contactedWhatsApp = true;
        const noteEntry = `[${today}] WhatsApp enviado a ${phone}: "${message.slice(0, 60)}..."`;
        compData.notes = compData.notes ? `${compData.notes}\n${noteEntry}` : noteEntry;

        await db
          .update(records)
          .set({ data: JSON.stringify(compData), updated: new Date().toISOString() })
          .where(eq(records.id, companyId));
      }
    }

    return Response.json({
      ok: true,
      messageId: bridgeData.messageId,
      message: `WhatsApp enviado exitosamente a ${phone}.`
    });
  } catch (e: any) {
    return Response.json({ error: e.message || 'Error al procesar envío de WhatsApp.' }, { status: 500 });
  }
}

