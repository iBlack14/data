'use client';
import {useRef,useState} from 'react';
import LocationFields from './location-fields';
import {Search,Download,ExternalLink,Mail,LoaderCircle,Square,X,MapPin,Zap,CheckCircle2,FileSpreadsheet} from 'lucide-react';

type Row=Record<string,any>;

const LIMA_DISTRICTS = [
  "Ancón", "Ate", "Barranco", "Breña", "Carabayllo", "Chaclacayo", "Chorrillos", "Cieneguilla",
  "Comas", "El Agustino", "Independencia", "Jesús María", "La Molina", "La Victoria", "Lima",
  "Lince", "Los Olivos", "Lurigancho", "Lurín", "Magdalena del Mar", "Miraflores", "Pachacámac",
  "Pucusana", "Pueblo Libre", "Puente Piedra", "Punta Hermosa", "Punta Negra", "Rímac",
  "San Bartolo", "San Borja", "San Isidro", "San Juan de Lurigancho", "San Juan de Miraflores",
  "San Luis", "San Martín de Porres", "San Miguel", "Santa Anita", "Santa María del Mar",
  "Santa Rosa", "Santiago de Surco", "Surquillo", "Villa El Salvador", "Villa María del Triunfo"
];

const TOP_10_DISTRICTS = [
  "Miraflores", "San Isidro", "Santiago de Surco", "San Borja", "La Molina",
  "San Miguel", "Magdalena del Mar", "Jesús María", "Lince", "Barranco"
];

function downloadRowsCSV(rows: Row[], sector: string, districtName: string, prefix = 'prospectos') {
  if (!rows || !rows.length) return;
  const headers = ['Empresa', 'Rubro', 'País', 'Región', 'Provincia', 'Ciudad', 'Distrito', 'Correo', 'Teléfono', 'Dirección', 'Web', 'Calificación', 'Reseñas', 'Fuente Google Maps', 'Fecha Extracción'];

  const csvRows = [
    headers,
    ...rows.map(r => [
      r.name || '',
      r.sector || sector || '',
      r.searchTerritory?.country || r.country || 'Perú',
      r.searchTerritory?.region || r.region || 'Lima',
      r.searchTerritory?.province || r.province || 'Lima',
      r.searchTerritory?.city || r.city || 'Lima',
      r.searchTerritory?.district || r.district || districtName || '',
      r.email || (Array.isArray(r.emails) && r.emails[0]) || '',
      r.phone || '',
      r.address || '',
      r.web || '',
      r.rating !== null && r.rating !== undefined ? String(r.rating) : '',
      r.reviewCount !== null && r.reviewCount !== undefined ? String(r.reviewCount) : '',
      r.source || '',
      r.extractedAt || new Date().toISOString()
    ])
  ];

  const csv = '\uFEFF' + csvRows.map(row => 
    row.map(val => {
      const s = String(val ?? '');
      return '"' + (/^[=+@\-]/.test(s) ? "'" : '') + s.replaceAll('"', '""') + '"';
    }).join(',')
  ).join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const safeSector = (sector || 'empresas').trim().toLowerCase().replace(/[^a-z0-9_-]+/gi, '_');
  const safeDistrict = (districtName || 'lima').trim().toLowerCase().replace(/[^a-z0-9_-]+/gi, '_');
  const filename = `${prefix}_${safeSector}_${safeDistrict}.csv`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export default function ProspectPanel({services,initial,companies,onImported,onClose}:{services:string[],initial:Row,companies:Row[],onImported:()=>Promise<void>,onClose:()=>void}) {
  const [mode,setMode]=useState<'auto'|'manual'>('auto');
  const [territory,setTerritory]=useState<Row>({
    country: initial.country || 'Perú',
    region: initial.region || 'Lima',
    province: initial.province || 'Lima',
    city: initial.city || 'Lima',
    district: initial.district || '',
    sector: initial.sector || ''
  });
  const [results,setResults]=useState<Row[]>([]);
  const [chosen,setChosen]=useState<Set<string>>(new Set());
  const [busy,setBusy]=useState(false);
  const [importing,setImporting]=useState(false);
  const [error,setError]=useState('');
  const [progress,setProgress]=useState('');
  const [nextOffset,setNextOffset]=useState<number|null>(null);
  const [lastSearch,setLastSearch]=useState<Row|null>(null);
  const [withEmails,setWithEmails]=useState(true);
  const [service,setService]=useState(services[0]);
  const [onlyNoWeb,setOnlyNoWeb]=useState(false);

  // Estados del barrido automático
  const [autoDistricts,setAutoDistricts]=useState<string[]>(LIMA_DISTRICTS);
  const [autoRunning,setAutoRunning]=useState(false);
  const [autoDelay,setAutoDelay]=useState(5);
  const [autoDownloadCSV,setAutoDownloadCSV]=useState(false);
  const [countdown,setCountdown]=useState<number|null>(null);
  const [autoHistory,setAutoHistory]=useState<{district:string,count:number,downloaded:boolean,rows:Row[],error?:string}[]>([]);
  const [autoAccumulated,setAutoAccumulated]=useState<Row[]>([]);
  const [autoProgress,setAutoProgress]=useState('');
  const [autoSector,setAutoSector]=useState('');

  const controller=useRef<AbortController|null>(null);
  const known=new Set(companies.map(r=>r.mapsId).filter(Boolean));
  const visible=results.filter(r=>!onlyNoWeb||!r.web);
  const selected=visible.filter(r=>chosen.has(r.mapsId)&&!known.has(r.mapsId));

  async function api(path:string,body:Row,signal?:AbortSignal){
    const r=await fetch('/api/prospect/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal});
    const data=await r.json() as Row;
    if(!r.ok)throw new Error(data.error||'No se pudo completar la operación.');
    return data;
  }

  async function enrich(list:Row[],signal:AbortSignal){
    let checked=0;
    const pending=list.filter(r=>r.web);
    for(let i=0;i<pending.length;i+=3){
      if(signal.aborted)return;
      await Promise.all(pending.slice(i,i+3).map(async r=>{
        try{
          const info=await api('enrich',{web:r.web},signal);
          setResults(old=>old.map(item=>item.mapsId===r.mapsId?{...item,...info}:item));
        }catch(e){
          if(!signal.aborted)setResults(old=>old.map(item=>item.mapsId===r.mapsId?{...item,emailStatus:(e as Error).message}:item));
        }finally{
          checked++;
          if(!signal.aborted)setProgress(`Revisando webs: ${checked} de ${pending.length}. Los resultados ya están disponibles abajo.`);
        }
      }));
    }
  }

  async function search(more=false){
    if(autoRunning){
      setError('El barrido automático sigue activo. Espera a que termine o detenlo antes de iniciar otra búsqueda.');
      return;
    }
    setError('');setBusy(true);
    const abort=new AbortController();
    controller.current=abort;
    setProgress('Consultando Google Maps…');
    const input=more&&lastSearch?lastSearch:territory;
    const offset=more?nextOffset:0;
    try{
      const data=await api('search',{...input,offset},abort.signal);
      if(!more){
        setResults(data.results);
        setChosen(new Set(data.results.filter((r:Row)=>!known.has(r.mapsId)).map((r:Row)=>r.mapsId)));
      }else{
        setResults(old=>[...old,...data.results.filter((r:Row)=>!old.some(x=>x.mapsId===r.mapsId))]);
        setChosen(old=>new Set([...old,...data.results.filter((r:Row)=>!known.has(r.mapsId)).map((r:Row)=>r.mapsId)]));
      }
      setLastSearch({...input});
      setNextOffset(data.nextOffset);
      setProgress(data.results.length?`${data.results.length} fichas obtenidas en esta página.`:'Google no devolvió fichas para esta búsqueda. Prueba un rubro o territorio distinto.');
      if(withEmails&&data.results.length)await enrich(data.results,abort.signal);
      if(!abort.signal.aborted&&data.results.length)setProgress('Extracción terminada. Revisa las fichas o descárgalas en CSV.');
    }catch(e){
      if(!abort.signal.aborted)setError((e as Error).message);
    }finally{
      if(abort.signal.aborted)setProgress('Búsqueda detenida.');
      setBusy(false);
      controller.current=null;
    }
  }

  async function runAutoSweep(){
    if(!territory.sector?.trim()){
      setError('Indica el rubro o actividad que deseas prospectar (ej. clínicas dentales, restaurantes).');
      return;
    }
    if(!autoDistricts.length){
      setError('Selecciona al menos un distrito de Lima para iniciar.');
      return;
    }
    setError('');
    setAutoRunning(true);
    setResults([]);
    setAutoHistory([]);
    setAutoAccumulated([]);
    const abort=new AbortController();
    controller.current=abort;

    const sectorName = territory.sector.trim();
    const queue = [...autoDistricts];
    let rateLimited = false;
    setAutoSector(sectorName);
    setAutoProgress(`Preparando barrido de ${queue.length} distritos…`);

    for(let i=0;i<queue.length;i++){
      if(abort.signal.aborted)break;
      const currentDistrict = queue[i];
      const districtProgress = `[Distrito ${i+1}/${queue.length}] ${currentDistrict}`;
      setProgress(`${districtProgress}: Consultando Google Maps…`);
      setAutoProgress(`${districtProgress}: Consultando Google Maps…`);

      const input = {
        country: 'Perú',
        region: 'Lima',
        province: 'Lima',
        city: 'Lima',
        district: currentDistrict,
        sector: sectorName,
        offset: 0
      };

      let districtResults: Row[] = [];
      try {
        const data = await api('search', input, abort.signal);
        districtResults = data.results || [];

        if(withEmails && districtResults.length && !abort.signal.aborted){
          setProgress(`${districtProgress}: Buscando correos en webs…`);
          setAutoProgress(`${districtProgress}: Buscando correos en webs…`);
          const pending = districtResults.filter(r=>r.web);
          for(let j=0;j<pending.length;j+=3){
            if(abort.signal.aborted)break;
            await Promise.all(pending.slice(j,j+3).map(async r=>{
              try{
                const info=await api('enrich',{web:r.web},abort.signal);
                districtResults=districtResults.map(item=>item.mapsId===r.mapsId?{...item,...info}:item);
              }catch(e){}
            }));
          }
        }

        if(districtResults.length > 0){
          if(autoDownloadCSV)downloadRowsCSV(districtResults, sectorName, currentDistrict, 'lima');
          setAutoHistory(prev=>[{district:currentDistrict,count:districtResults.length,downloaded:autoDownloadCSV,rows:districtResults},...prev]);
          setAutoAccumulated(prev=>[...prev,...districtResults]);
          setResults(prev=>[...districtResults,...prev.filter(r=>!districtResults.some(d=>d.mapsId===r.mapsId))]);
          const message = `✅ ${districtProgress}: ${districtResults.length} empresas extraídas${autoDownloadCSV?' · CSV descargado':''}`;
          setProgress(message);
          setAutoProgress(message);
        } else {
          setAutoHistory(prev=>[{district:currentDistrict,count:0,downloaded:false,rows:[]} ,...prev]);
          const message = `⚪ ${districtProgress}: 0 empresas encontradas.`;
          setProgress(message);
          setAutoProgress(message);
        }

        // Si hay un siguiente distrito, pausar para proteger la conexión
        if(i < queue.length - 1 && !abort.signal.aborted){
          for(let s=autoDelay; s>0; s--){
            if(abort.signal.aborted)break;
            setCountdown(s);
            const message = `⏳ Siguiente distrito (${queue[i+1]}) en ${s}s para evitar bloqueos de Google…`;
            setProgress(message);
            setAutoProgress(message);
            await new Promise(res=>setTimeout(res,1000));
          }
          setCountdown(null);
        }
      } catch(err:any){
        if(abort.signal.aborted)break;
        const msg = err.message || 'Error en la consulta';
        setAutoHistory(prev=>[{district:currentDistrict,count:0,downloaded:false,rows:[],error:msg},...prev]);
        setError(`Error en ${currentDistrict}: ${msg}`);
        const message = `⚠️ Error en ${currentDistrict}: ${msg}.`;
        setProgress(message);
        setAutoProgress(message);
        if(msg.includes('429') || msg.includes('limitado')){
          rateLimited = true;
          const limitedMessage = `⚠️ Google aplicó un límite temporal en ${currentDistrict}. Se detuvo el barrido preventivamente.`;
          setProgress(limitedMessage);
          setAutoProgress(limitedMessage);
          break;
        }
        await new Promise(res=>setTimeout(res,3000));
      }
    }

    setCountdown(null);
    setAutoRunning(false);
    controller.current=null;
    if(!rateLimited&&!abort.signal.aborted){
      const message = autoDownloadCSV
        ?'🎉 Barrido completado. Los CSVs de cada distrito están en tu carpeta de descargas.'
        :'🎉 Barrido completado. Los resultados están disponibles para descargar en un solo CSV o guardar en Empresas.';
      setProgress(message);
      setAutoProgress(message);
    } else if(abort.signal.aborted) {
      const message = autoDownloadCSV
        ?'Barrido detenido. Los resultados procesados están disponibles en el panel y los CSVs descargados están en tu carpeta de descargas.'
        :'Barrido detenido. Los resultados procesados siguen disponibles en el panel para descargar o guardar en Empresas.';
      setProgress(message);
      setAutoProgress(message);
    }
  }

  async function importSelected(){
    setImporting(true);setError('');
    try{
      const data=await api('import',{results:selected,service});
      await onImported();
      setProgress(`${data.imported} empresas guardadas · ${data.duplicates} duplicados omitidos.`);
      setChosen(new Set());
    }catch(e){
      setError((e as Error).message);
    }finally{
      setImporting(false);
    }
  }

  async function importAccumulated(){
    if(!autoAccumulated.length)return;
    setImporting(true);setError('');
    try{
      const data=await api('import',{results:autoAccumulated,service});
      await onImported();
      setProgress(`${data.imported} empresas del barrido guardadas en CRM · ${data.duplicates} duplicados omitidos.`);
    }catch(e){
      setError((e as Error).message);
    }finally{
      setImporting(false);
    }
  }

  async function retryEmail(r:Row){
    setBusy(true);setError('');
    const abort=new AbortController();
    controller.current=abort;
    try{
      await enrich([r],abort.signal);
    }finally{
      setBusy(false);
      controller.current=null;
    }
  }

  function toggleDistrict(d:string){
    if(autoDistricts.includes(d)){
      setAutoDistricts(autoDistricts.filter(x=>x!==d));
    } else {
      setAutoDistricts([...autoDistricts,d]);
    }
  }

  return (
    <section className="card prospect">
      <div className="sectionhead">
        <div>
          <div className="eyebrow">RECOPILACIÓN Y EXPORTACIÓN DE PROSPECTOS</div>
          <h2>Extraer empresas de Google Maps</h2>
          <p>Consulta fichas de Google Maps y acumula resultados para descargarlos juntos o guardarlos en Empresas.</p>
        </div>
        <button className="iconbutton" aria-label="Cerrar extractor" onClick={()=>{controller.current?.abort();onClose();}}>
          <X size={20}/>
        </button>
      </div>

      <div className="prospecttabs">
        <button type="button" className={`prospecttab ${mode==='auto'?'active':''}`} onClick={()=>setMode('auto')}>
          <Zap size={14}/> Barrido automático (Lima distrito por distrito)
        </button>
        <button type="button" className={`prospecttab ${mode==='manual'?'active':''}`} onClick={()=>setMode('manual')}>
          <Search size={14}/> Búsqueda individual
        </button>
      </div>

      {autoRunning&&(
        <div className="notice prospect-live-status" role="status" aria-live="polite" style={{position:'sticky',top:122,zIndex:5,display:'flex',alignItems:'center',gap:10}}>
          <LoaderCircle className="spin" size={16}/>
          <div style={{flex:1}}>
            <b>Extracción activa: {autoSector}</b>
            <div>{autoProgress}</div>
            <small>{autoHistory.length} distritos procesados · {autoAccumulated.length} empresas recopiladas. No inicies otra búsqueda hasta que termine o la detengas.</small>
          </div>
          <button type="button" className="button" onClick={()=>controller.current?.abort()}><Square size={12}/> Detener</button>
        </div>
      )}

      {mode==='auto' && (
        <div className="autobox">
          <div className="autoinfobar">
            <div>
              <b>🇵🇪 Configuración fija: Perú → Lima → Lima (Distritos)</b>
              <p>Los resultados se acumulan durante el barrido. Al terminar, puedes descargarlos juntos o guardarlos en Empresas.</p>
            </div>
            <span className="pill">{autoDistricts.length} de {LIMA_DISTRICTS.length} distritos seleccionados</span>
          </div>

          <div className="formgrid" style={{marginBottom:15}}>
            <label>
              Rubro o actividad comercial
              <input 
                disabled={autoRunning} 
                required 
                value={territory.sector} 
                placeholder="Ej. clínicas dentales, restaurantes, agencias…" 
                onChange={e=>setTerritory({...territory,sector:e.target.value})}
              />
            </label>

            <label>
              Pausa de seguridad entre distritos
              <select value={autoDelay} disabled={autoRunning} onChange={e=>setAutoDelay(Number(e.target.value))}>
                <option value={3}>3 segundos</option>
                <option value={5}>5 segundos (Recomendado)</option>
                <option value={8}>8 segundos (Mayor seguridad)</option>
                <option value={10}>10 segundos</option>
              </select>
            </label>

            <label style={{justifyContent:'flex-end'}}>
              Servicio de interés asociado
              <select value={service} disabled={autoRunning} onChange={e=>setService(e.target.value)}>
                {services.map(s=><option key={s}>{s}</option>)}
              </select>
            </label>
          </div>

          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap',marginTop:8}}>
            <span style={{fontSize:11,fontWeight:600,color:'#395444'}}>Distritos a procesar:</span>
            <div style={{display:'flex',gap:8}}>
              <button type="button" className="textbutton" disabled={autoRunning} onClick={()=>setAutoDistricts([...LIMA_DISTRICTS])}>
                Seleccionar todos ({LIMA_DISTRICTS.length})
              </button>
              <button type="button" className="textbutton" disabled={autoRunning} onClick={()=>setAutoDistricts([...TOP_10_DISTRICTS])}>
                Top 10 comerciales
              </button>
              <button type="button" className="textbutton" disabled={autoRunning} onClick={()=>setAutoDistricts([])}>
                Desmarcar todos
              </button>
            </div>
          </div>

          <div className="districtgrid">
            {LIMA_DISTRICTS.map(d=>(
              <label key={d} className="districtitem">
                <input 
                  type="checkbox" 
                  disabled={autoRunning} 
                  checked={autoDistricts.includes(d)} 
                  onChange={()=>toggleDistrict(d)}
                />
                <span>{d}</span>
              </label>
            ))}
          </div>

          <div className="prospectcontrols" style={{marginTop:15}}>
            <label className="checkrow">
              <input type="checkbox" checked={withEmails} disabled={autoRunning} onChange={e=>setWithEmails(e.target.checked)}/> 
              Buscar correos en webs publicadas
            </label>

            <label className="checkrow">
              <input type="checkbox" checked={autoDownloadCSV} disabled={autoRunning} onChange={e=>setAutoDownloadCSV(e.target.checked)}/>
              Descargar CSV automáticamente por cada distrito
            </label>

            {!autoRunning ? (
              <button type="button" className="primary" onClick={runAutoSweep}>
                <Zap size={16}/> Iniciar barrido
              </button>
            ) : <span className="pill">Usa el botón Detener del estado de extracción.</span>}
          </div>

          {autoHistory.length > 0 && (
            <div style={{marginTop:20}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <b style={{fontSize:12}}>Distritos procesados ({autoHistory.length}):</b>
                {autoAccumulated.length > 0 && (
                  <div style={{display:'flex',gap:8}}>
                    <button type="button" className="button" onClick={()=>downloadRowsCSV(autoAccumulated, territory.sector, 'Metropolitana_Consolidado', 'lima')}>
                      <FileSpreadsheet size={15}/> Descargar CSV Consolidado ({autoAccumulated.length})
                    </button>
                    <button type="button" className="primary" disabled={importing} onClick={importAccumulated}>
                      <Download size={15}/> Guardar todos ({autoAccumulated.length}) en Empresas
                    </button>
                  </div>
                )}
              </div>

              <div className="historylist">
                {autoHistory.map((h,idx)=>(
                  <div key={h.district+idx} className={`historyrow ${h.count>0?'success':''}`}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      {h.count > 0 ? <CheckCircle2 size={14} color="#236c50"/> : <span className="dot"/>}
                      <b>{h.district}</b>
                      <span>· {h.count} empresas</span>
                      {h.error && <span style={{color:'#c43b3b'}}>({h.error})</span>}
                    </div>
                    {h.count > 0 && (
                      <div className="historyactions">
                        <button type="button" className="textbutton" onClick={()=>downloadRowsCSV(h.rows, territory.sector, h.district, 'lima')}>
                          <Download size={13}/> Re-descargar CSV
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {mode==='manual' && (
        <form className="prospectform" onSubmit={e=>{e.preventDefault();search();}}>
          <div className="prospectfields">
            <label>
              Rubro o actividad
              <input disabled={busy||importing} required value={territory.sector} placeholder="Ej. clínicas dentales" onChange={e=>setTerritory({...territory,sector:e.target.value})}/>
            </label>
            <LocationFields value={territory} onChange={setTerritory} disabled={busy||importing}/>
          </div>
          <div className="prospectcontrols">
            <label className="checkrow">
              <input type="checkbox" checked={withEmails} disabled={busy} onChange={e=>setWithEmails(e.target.checked)}/> 
              Buscar correos en las webs empresariales
            </label>
            <span>20 fichas por página</span>
            <button className="primary" disabled={busy||importing||autoRunning}>
              {busy?<LoaderCircle className="spin" size={16}/>:<Search size={16}/>} 
              {busy?'Extrayendo…':'Extraer empresas'}
            </button>
            {busy&&<button className="button" type="button" onClick={()=>controller.current?.abort()}><Square size={12}/> Detener</button>}
          </div>
        </form>
      )}

      {error&&<div className="notice error" role="alert">{error}</div>}
      {progress&&<div className="notice" role="status">{(busy||autoRunning)&&<LoaderCircle className="spin" size={14}/>} {progress}</div>}

      {!!results.length && (
        <>
          <div className="prospectsummary">
            <div>
              <b>{results.length} fichas recopiladas</b>
              <small>{results.filter(r=>r.phone).length} con teléfono · {results.filter(r=>r.web).length} con web · {results.filter(r=>r.email).length} con correo publicado</small>
            </div>
            <div style={{display:'flex',gap:12,alignItems:'center'}}>
              <label className="checkrow">
                <input type="checkbox" checked={onlyNoWeb} onChange={e=>setOnlyNoWeb(e.target.checked)}/> 
                Solo empresas sin web
              </label>
              <button type="button" className="button" onClick={()=>downloadRowsCSV(visible, territory.sector, territory.district || 'resultados')}>
                <Download size={15}/> Descargar CSV ({visible.length})
              </button>
            </div>
          </div>

          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>
                    <input 
                      aria-label="Seleccionar todas las fichas visibles" 
                      type="checkbox" 
                      checked={visible.some(r=>!known.has(r.mapsId))&&visible.filter(r=>!known.has(r.mapsId)).every(r=>chosen.has(r.mapsId))} 
                      onChange={e=>{
                        const next=new Set(chosen);
                        visible.forEach(r=>{
                          if(!known.has(r.mapsId)){
                            if(e.target.checked)next.add(r.mapsId);
                            else next.delete(r.mapsId);
                          }
                        });
                        setChosen(next);
                      }}
                    />
                  </th>
                  <th>EMPRESA / DIRECCIÓN</th>
                  <th>TELÉFONO</th>
                  <th>WEB / CORREO</th>
                  <th>FUENTE</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(r=>(
                  <tr key={r.mapsId}>
                    <td>
                      <input 
                        aria-label={'Seleccionar '+r.name} 
                        type="checkbox" 
                        disabled={known.has(r.mapsId)} 
                        checked={chosen.has(r.mapsId)&&!known.has(r.mapsId)} 
                        onChange={e=>{
                          const next=new Set(chosen);
                          if(e.target.checked)next.add(r.mapsId);
                          else next.delete(r.mapsId);
                          setChosen(next);
                        }}
                      />
                    </td>
                    <td className="prospectname">
                      <b>{r.name}</b>
                      <small>{r.sector}</small>
                      <small><MapPin size={10}/> {r.address||'Dirección no publicada'}</small>
                      {r.rating!==null&&<small>★ {r.rating} {r.reviewCount!==null?`· ${r.reviewCount} reseñas`:''}</small>}
                      {known.has(r.mapsId)&&<span className="badge">Ya está en Empresas</span>}
                    </td>
                    <td>{r.phone||'No publicado'}</td>
                    <td className="prospectcontact">
                      {r.web?<a href={r.web} target="_blank" rel="noreferrer">{new URL(r.web).hostname} <ExternalLink size={11}/></a>:<span className="badge off">Sin web publicada</span>}
                      {r.email?<><b>{r.email}</b><small>{r.emails?.length>1?`${r.emails.length} correos encontrados`:'Correo publicado en web'}</small></>:<small>{r.emailStatus||'Pendiente'}</small>}
                      {r.emailSources?.map((url:string)=><a key={url} className="emailsource" href={url} target="_blank" rel="noreferrer">Fuente del correo <ExternalLink size={10}/></a>)}
                      {r.web&&!r.email&&<button className="textbutton" disabled={busy||autoRunning} onClick={()=>retryEmail(r)}><Mail size={12}/> Buscar correo</button>}
                    </td>
                    <td>
                      <a className="textbutton" href={r.source} target="_blank" rel="noreferrer">Ver ficha <ArrowIcon/></a>
                      <small>{new Date(r.extractedAt).toLocaleDateString('es-PE',{timeZone:'America/Lima'})}</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="importbar">
            <label>
              Servicio de interés
              <select value={service} onChange={e=>setService(e.target.value)}>
                {services.map(s=><option key={s}>{s}</option>)}
              </select>
            </label>
            <button className="primary" disabled={busy||importing||!selected.length} onClick={importSelected}>
              <Download size={16}/>{importing?'Importando…':`Guardar ${selected.length} en Empresas`}
            </button>
            {mode==='manual' && nextOffset!==null && (
              <button className="button" disabled={busy||importing} onClick={()=>search(true)}>
                Obtener siguiente página
              </button>
            )}
          </div>
        </>
      )}

      <div className="hint prospecthint">
        Los datos reflejan lo publicado al consultar; pueden faltar o estar desactualizados. Google puede incluir negocios cercanos al territorio solicitado. Los permisos para publicidad quedan desactivados al importar.
      </div>
    </section>
  );
}

function ArrowIcon(){
  return <ExternalLink size={12}/>;
}
