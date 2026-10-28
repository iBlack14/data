import { getChatGPTUser } from '../../../chatgpt-auth';
import { findWebsiteEmails } from '../../../../lib/prospecting.mjs';
export async function POST(request:Request) {
  if(!await getChatGPTUser()) return Response.json({error:'Inicia sesión.'},{status:401});
  try { const {web}=await request.json() as {web:string}; return Response.json(await findWebsiteEmails(web)); }
  catch(e:any) { return Response.json({error:e.name==='TimeoutError'?'La web tardó demasiado en responder.':e.message||'No se pudo leer la web.'},{status:e.status||502}); }
}
