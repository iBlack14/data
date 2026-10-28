import { getChatGPTUser } from '../../../chatgpt-auth';
import { searchMaps } from '../../../../lib/prospecting.mjs';
export async function POST(request:Request) {
  if(!await getChatGPTUser()) return Response.json({error:'Inicia sesión.'},{status:401});
  try { return Response.json(await searchMaps(await request.json())); }
  catch(e:any) { return Response.json({error:e.name==='TimeoutError'?'La búsqueda tardó demasiado. Prueba más tarde.':e.message||'No se pudo consultar Google Maps.'},{status:e.status||502}); }
}
