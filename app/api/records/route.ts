import { getChatGPTUser } from '../../chatgpt-auth';
import { getDb } from '../../../db';
import { records } from '../../../db/schema';
import { and, eq } from 'drizzle-orm';

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({error:'Inicia sesión para acceder al CRM.'},{status:401});
  const rows = await getDb().select().from(records).where(eq(records.owner,user.userId));
  return Response.json(rows.map(r=>({...JSON.parse(r.data),id:r.id,kind:r.kind})));
}
export async function POST(request:Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({error:'Inicia sesión.'},{status:401});
  try {
    const body = await request.json();
    if (!Array.isArray(body) || body.length>1000) throw new Error('Máximo 1000 registros por importación.');
    const rows=body.map((r:any)=>{
      if (!['company','campaign','territory','settings'].includes(r.kind) || JSON.stringify(r).length>30000) throw new Error('Registro inválido.');
      const {id,kind,...data}=r;
      if(kind==='company') {
        if(typeof data.name!=='string'||!data.name.trim()||typeof data.country!=='string'||!data.country.trim()) throw new Error('Empresa y país son obligatorios.');
        if((data.permissionEmail||data.permissionWhatsApp)&&!String(data.permissionEvidence||'').trim()) throw new Error('Registra la evidencia de autorización.');
      }
      return {id:typeof id==='string'?id:crypto.randomUUID(),owner:user.userId,kind,data:JSON.stringify(data),updated:new Date().toISOString()};
    });
    const db=getDb();
    // IDs are namespaced by owner, so one account cannot overwrite another.
    for (const r of rows) {
      r.id = r.id.startsWith(user.userId+':')?r.id:user.userId+':'+r.id;
      await db.insert(records).values(r).onConflictDoUpdate({target:records.id,set:{data:r.data,updated:r.updated},where:eq(records.owner,user.userId)});
    }
    return Response.json({ok:true});
  } catch(e) {return Response.json({error:e instanceof Error?e.message:'No se pudo guardar.'},{status:400});}
}
export async function DELETE(request:Request) {
  const user=await getChatGPTUser();
  if(!user)return Response.json({error:'Inicia sesión.'},{status:401});
  const {id}=await request.json() as {id:string};
  await getDb().delete(records).where(and(eq(records.id,id),eq(records.owner,user.userId)));
  return Response.json({ok:true});
}


