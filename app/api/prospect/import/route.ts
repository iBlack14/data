import { getChatGPTUser } from '../../../chatgpt-auth';
import { getDb } from '../../../../db';
import { records } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
export async function POST(request:Request) {
  const user=await getChatGPTUser();
  if(!user)return Response.json({error:'Inicia sesión.'},{status:401});
  try {
    const body=await request.json() as {results:Record<string,any>[],service:string};
    if(!Array.isArray(body.results)||!body.results.length||body.results.length>120) return Response.json({error:'Selecciona entre 1 y 120 empresas.'},{status:400});
    const db=getDb();
    const existing=await db.select().from(records).where(eq(records.owner,user.userId));
    const known=new Set(existing.filter(r=>r.kind==='company').map(r=>JSON.parse(r.data).mapsId).filter(Boolean));
    let duplicates=0;
    const incoming=[];
    for(const r of body.results) {
      if(!r.name||typeof r.name!=='string'||!/^0x[\da-f]+:0x[\da-f]+$/i.test(r.mapsId)||!r.searchTerritory?.country||JSON.stringify(r).length>20000) throw new Error('Resultado inválido. Repite la búsqueda.');
      if(known.has(r.mapsId)){duplicates++;continue;}
      const territory=r.searchTerritory;
      const clean:Record<string,any>={};
      for(const k of ['name','sector','mapsId','placeId','address','phone','web','email','rating','reviewCount','source','extractedAt','searchTerritory','emailSources','emails','emailStatus','emailCheckedAt']) if(r[k]!==undefined)clean[k]=r[k];
      const data={...clean,country:territory.country,region:territory.region||'',province:territory.province||'',city:territory.city||'',district:territory.district||'',locationOrigin:'search',verified:'',stage:'Nuevo',service:body.service||'Diseño y creación de páginas web',permissionEmail:false,permissionWhatsApp:false,permissionEvidence:'',suppressed:false,next:'',lastContact:'',notes:'Importado desde Google Maps. La ubicación administrativa corresponde al territorio consultado; confirmar contra la dirección de la ficha. Extracción: '+r.extractedAt};
      incoming.push({id:user.userId+':maps:'+r.mapsId,owner:user.userId,kind:'company',data:JSON.stringify(data),updated:new Date().toISOString()});
      known.add(r.mapsId);
    }
    const statements=[];
    for(let i=0;i<incoming.length;i+=10) statements.push(db.insert(records).values(incoming.slice(i,i+10)).onConflictDoNothing().returning({id:records.id}));
    const inserted=statements.length?await db.batch(statements as [typeof statements[number],...typeof statements[number][]]):[];
    const imported=inserted.reduce((total,rows)=>total+rows.length,0);
    duplicates+=incoming.length-imported;
    return Response.json({imported,duplicates});
  }catch(e:any){return Response.json({error:e.message||'No se pudo importar.'},{status:400});}
}
