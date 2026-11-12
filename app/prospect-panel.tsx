'use client';
import {useEffect,useRef,useState} from 'react';
import LocationFields from './location-fields';
import {Search,Download,ExternalLink,Mail,LoaderCircle,Square,X,MapPin,Zap,CheckCircle2,FileSpreadsheet,Globe,Pause,Play,RotateCcw,Trash2} from 'lucide-react';
import PE_REGIONS_DATA from '../public/geography/PE.json';
import {
  TargetLocation,
  buildLocationQueue,
  buildNationalQueue,
  isDuplicateRecord,
  registerSeenRecord,
  cleanPhone
} from '../lib/peru-localities';

const SWEEP_STORAGE_KEY = 'odisea_sweep_state_v1';

function saveSweepState(
  queue: TargetLocation[],
  currentIndex: number,
  sector: string,
  autoScope: 'province'|'national',
  nationalType: 'all'|'top',
  autoRegion: string,
  autoProvince: string,
  autoAccumulated: Row[],
  autoHistory: any[],
  interruptedTarget: string
) {
  try {
    const data = {
      queue,
      currentIndex,
      sector,
      autoScope,
      nationalType,
      autoRegion,
      autoProvince,
      autoAccumulated,
      autoHistory,
      interruptedTarget,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(SWEEP_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {}
}

function clearSweepState() {
  try {
    localStorage.removeItem(SWEEP_STORAGE_KEY);
  } catch (e) {}
}

type Row=Record<string,any>;

type GeoProvince = {
  name: string;
  districts: string[];
};

type GeoRegion = {
  name: string;
  cities: string[];
  provinces: GeoProvince[];
};

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

// Principales zonas y distritos comerciales clave en todo el Perú
const TOP_PERU_TARGETS: TargetLocation[] = [
  // Lima Metropolitana
  { region: 'Lima', province: 'Lima', district: 'Miraflores' },
  { region: 'Lima', province: 'Lima', district: 'San Isidro' },
  { region: 'Lima', province: 'Lima', district: 'Santiago de Surco' },
  { region: 'Lima', province: 'Lima', district: 'San Borja' },
  { region: 'Lima', province: 'Lima', district: 'La Molina' },
  { region: 'Lima', province: 'Lima', district: 'San Miguel' },
  { region: 'Lima', province: 'Lima', district: 'Lima' },
  { region: 'Lima', province: 'Lima', district: 'Los Olivos' },
  // Callao
  { region: 'Callao', province: 'Callao', district: 'Callao' },
  { region: 'Callao', province: 'Callao', district: 'Bellavista' },
  // Arequipa
  { region: 'Arequipa', province: 'Arequipa', district: 'Arequipa' },
  { region: 'Arequipa', province: 'Arequipa', district: 'Yanahuara' },
  { region: 'Arequipa', province: 'Arequipa', district: 'Cayma' },
  // La Libertad (Trujillo)
  { region: 'La Libertad', province: 'Trujillo', district: 'Trujillo' },
  { region: 'La Libertad', province: 'Trujillo', district: 'Victor Larco Herrera' },
  // Lambayeque (Chiclayo)
  { region: 'Lambayeque', province: 'Chiclayo', district: 'Chiclayo' },
  { region: 'Lambayeque', province: 'Chiclayo', district: 'La Victoria' },
  // Piura
  { region: 'Piura', province: 'Piura', district: 'Piura' },
  { region: 'Piura', province: 'Piura', district: 'Castilla' },
  // Cusco
  { region: 'Cusco', province: 'Cusco', district: 'Cusco' },
  { region: 'Cusco', province: 'Cusco', district: 'Wanchaq' },
  // Junín (Huancayo)
  { region: 'Junin', province: 'Huancayo', district: 'Huancayo' },
  { region: 'Junin', province: 'Huancayo', district: 'El Tambo' },
  // Ica
  { region: 'Ica', province: 'Ica', district: 'Ica' },
  // Ancash (Chimbote / Huaraz)
  { region: 'Ancash', province: 'Santa', district: 'Chimbote' },
  { region: 'Ancash', province: 'Santa', district: 'Nuevo Chimbote' },
  // Tacna
  { region: 'Tacna', province: 'Tacna', district: 'Tacna' },
  // Loreto (Iquitos)
  { region: 'Loreto', province: 'Maynas', district: 'Iquitos' },
  // San Martín (Tarapoto)
  { region: 'San Martin', province: 'San Martin', district: 'Tarapoto' },
  // Ucayali (Pucallpa)
  { region: 'Ucayali', province: 'Coronel Portillo', district: 'Calleria' }
];

function downloadRowsCSV(rows: Row[], sector: string, districtName: string, prefix = 'prospectos') {
  if (!rows || !rows.length) return;
  const headers = [
    'Empresa', 'Rubro', 'País', 'Región', 'Provincia', 'Ciudad', 'Distrito', 'Localidad / Centro Poblado',
    'Correo', 'Teléfono', 'Dirección', 'Web', 'Latitud', 'Longitud', 'Calificación', 'Reseñas',
    'Fuente Google Maps', 'Fecha Extracción'
  ];

  const csvRows = [
    headers,
    ...rows.map(r => [
      r.name || '',
      r.sector || sector || '',
      r.searchTerritory?.country || r.country || 'Perú',
      r.searchTerritory?.region || r.region || '',
      r.searchTerritory?.province || r.province || '',
      r.searchTerritory?.city || r.city || '',
      r.searchTerritory?.district || r.district || districtName || '',
      r.searchTerritory?.locality || r.locality || '',
      r.email || (Array.isArray(r.emails) && r.emails[0]) || '',
      r.phone || '',
      r.address || '',
      r.web || '',
      r.latitude !== null && r.latitude !== undefined ? String(r.latitude) : '',
      r.longitude !== null && r.longitude !== undefined ? String(r.longitude) : '',
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
  const safeDistrict = (districtName || 'peru').trim().toLowerCase().replace(/[^a-z0-9_-]+/gi, '_');
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

  // Estados del barrido automático multirregional (Todo el Perú)
  const [autoScope,setAutoScope]=useState<'province'|'national'>('province');
  const [nationalType,setNationalType]=useState<'all'|'top'>('all');
  const [autoRegion,setAutoRegion]=useState<string>('Lima');
  const [autoProvince,setAutoProvince]=useState<string>('Lima');
  const [autoDistricts,setAutoDistricts]=useState<string[]>(LIMA_DISTRICTS);
  const [includeLocalities,setIncludeLocalities]=useState<boolean>(true);
  const [autoNationalTargets,setAutoNationalTargets]=useState<TargetLocation[]>(TOP_PERU_TARGETS);

  const [autoRunning,setAutoRunning]=useState(false);
  const [autoPaused,setAutoPaused]=useState(false);
  const [hasInterruptedSweep,setHasInterruptedSweep]=useState(false);
  const [interruptedTarget,setInterruptedTarget]=useState<string>('');
  const [autoDelay,setAutoDelay]=useState(5);
  const [autoDownloadCSV,setAutoDownloadCSV]=useState(false);
  const [countdown,setCountdown]=useState<number|null>(null);
  const [autoHistory,setAutoHistory]=useState<{district:string,count:number,downloaded:boolean,rows:Row[],error?:string}[]>([]);
  const [autoAccumulated,setAutoAccumulated]=useState<Row[]>([]);
  const [autoProgress,setAutoProgress]=useState('');
  const [autoSector,setAutoSector]=useState('');

  const pauseRef = useRef<boolean>(false);
  const queueRef = useRef<TargetLocation[]>([]);
  const currentIndexRef = useRef<number>(0);
  const seenMapsIdsRef = useRef<Set<string>>(new Set());
  const seenPhonesRef = useRef<Set<string>>(new Set());
  const seenNamesRef = useRef<Set<string>>(new Set());

  // Restaurar barrido interrumpido desde localStorage al cargar o recargar la página
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SWEEP_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved && Array.isArray(saved.queue) && saved.queue.length > 0 && typeof saved.currentIndex === 'number' && saved.currentIndex < saved.queue.length) {
        queueRef.current = saved.queue;
        currentIndexRef.current = saved.currentIndex;
        if (saved.sector) {
          setAutoSector(saved.sector);
          setTerritory(prev => ({ ...prev, sector: saved.sector }));
        }
        if (saved.autoScope) setAutoScope(saved.autoScope);
        if (saved.nationalType) setNationalType(saved.nationalType);
        if (saved.autoRegion) setAutoRegion(saved.autoRegion);
        if (saved.autoProvince) setAutoProvince(saved.autoProvince);
        if (Array.isArray(saved.autoAccumulated) && saved.autoAccumulated.length > 0) {
          setAutoAccumulated(saved.autoAccumulated);
          setResults(saved.autoAccumulated);
          for (const item of saved.autoAccumulated) {
            registerSeenRecord(item, seenMapsIdsRef.current, seenPhonesRef.current, seenNamesRef.current);
          }
        }
        if (Array.isArray(saved.autoHistory)) setAutoHistory(saved.autoHistory);

        const lastTarget = saved.queue[saved.currentIndex];
        const targetName = saved.interruptedTarget || lastTarget?.label || `${lastTarget?.district} (${lastTarget?.region})`;
        setInterruptedTarget(targetName);
        setHasInterruptedSweep(true);
        const pend = saved.queue.length - saved.currentIndex;
        setProgress(`Se restauró el barrido anterior (${pend} localidades pendientes desde ${targetName}). Haz clic en Continuar barrido.`);
      }
    } catch (e) {}
  }, []);

  const peRegions = PE_REGIONS_DATA as unknown as GeoRegion[];
  const currentRegionData = peRegions.find(r => r.name.toLowerCase() === autoRegion.toLowerCase()) || peRegions.find(r => r.name === 'Lima') || peRegions[0];
  const availableProvinces = currentRegionData?.provinces || [];
  const currentProvinceData = availableProvinces.find(p => p.name.toLowerCase() === autoProvince.toLowerCase()) || availableProvinces[0];
  const availableDistricts = currentProvinceData?.districts || [];

  function handleRegionChange(newReg: string) {
    setAutoRegion(newReg);
    const regObj = peRegions.find(r => r.name.toLowerCase() === newReg.toLowerCase());
    const matchProv = regObj?.provinces.find(p => p.name.toLowerCase() === newReg.toLowerCase()) || regObj?.provinces[0];
    const provName = matchProv?.name || '';
    setAutoProvince(provName);
    setAutoDistricts([...(matchProv?.districts || [])]);
  }

  function handleProvinceChange(newProv: string) {
    setAutoProvince(newProv);
    const provObj = availableProvinces.find(p => p.name.toLowerCase() === newProv.toLowerCase());
    setAutoDistricts([...(provObj?.districts || [])]);
  }

  function toggleDistrict(d:string){
    if(autoDistricts.includes(d)){
      setAutoDistricts(autoDistricts.filter(x=>x!==d));
    } else {
      setAutoDistricts([...autoDistricts,d]);
    }
  }

  function toggleNationalTarget(t: TargetLocation){
    const exists = autoNationalTargets.some(x => x.region === t.region && x.province === t.province && x.district === t.district);
    if(exists){
      setAutoNationalTargets(autoNationalTargets.filter(x => !(x.region === t.region && x.province === t.province && x.district === t.district)));
    } else {
      setAutoNationalTargets([...autoNationalTargets, t]);
    }
  }

  const controller=useRef<AbortController|null>(null);
  const known=new Set(companies.map(r=>r.mapsId).filter(Boolean));
  const visible=results.filter(r=>!onlyNoWeb||!r.web);
  const selected=visible.filter(r=>chosen.has(r.mapsId)&&!known.has(r.mapsId));

  async function api(path:string,body:Row,signal?:AbortSignal){
    const r=await fetch('/api/prospect/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal});
    const data=await r.json() as Row;
    if(!r.ok){
      const err = new Error(data.error||'No se pudo completar la operación.') as any;
      err.status = r.status;
      throw err;
    }
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

  function handlePauseSweep() {
    pauseRef.current = true;
    setAutoPaused(true);
    const msg = '⏸️ Barrido pausado. Haz clic en Reanudar para continuar sin perder resultados acumulados.';
    setProgress(msg);
    setAutoProgress(msg);
  }

  function handleResumeSweep() {
    pauseRef.current = false;
    setAutoPaused(false);
    const msg = '▶️ Reanudando barrido…';
    setProgress(msg);
    setAutoProgress(msg);
  }

  function handleStopSweep() {
    controller.current?.abort();
    pauseRef.current = false;
    setAutoPaused(false);
  }

  async function runAutoSweep(resume = false){
    if(!territory.sector?.trim()){
      setError('Indica el rubro o actividad que deseas prospectar (ej. clínicas dentales, restaurantes, transportes).');
      return;
    }

    let queue: TargetLocation[] = [];
    if(resume && queueRef.current.length > 0){
      queue = queueRef.current;
    } else {
      if(autoScope==='province'){
        if(!autoDistricts.length){
          setError(`Selecciona al menos un distrito de ${autoProvince} (${autoRegion}) para iniciar.`);
          return;
        }
        const base = autoDistricts.map(d=>({
          region: autoRegion,
          province: autoProvince,
          district: d
        }));
        queue = buildLocationQueue(base, includeLocalities);
      } else {
        if(nationalType === 'all'){
          queue = buildNationalQueue(peRegions, includeLocalities);
        } else {
          queue = buildLocationQueue(autoNationalTargets, includeLocalities);
        }
      }

      queueRef.current = queue;
      currentIndexRef.current = 0;
      seenMapsIdsRef.current = new Set(companies.map(c=>c.mapsId).filter(Boolean));
      seenPhonesRef.current = new Set(companies.map(c=>cleanPhone(c.phone)).filter(p=>p.length>=7));
      seenNamesRef.current = new Set();
      setResults([]);
      setAutoHistory([]);
      setAutoAccumulated([]);
    }

    if(!queue.length){
      setError('No se encontraron ubicaciones geográficas para el barrido seleccionado.');
      return;
    }

    setError('');
    setAutoRunning(true);
    setAutoPaused(false);
    pauseRef.current = false;
    setHasInterruptedSweep(false);

    const abort=new AbortController();
    controller.current=abort;

    const sectorName = territory.sector.trim();
    let rateLimited = false;
    setAutoSector(sectorName);

    const startIndex = resume ? currentIndexRef.current : 0;
    setAutoProgress(resume
      ? `Reanudando barrido en ubicación ${startIndex + 1} de ${queue.length}…`
      : `Preparando barrido inteligente de ${queue.length} zonas/localidades en el Perú…`
    );

    for(let i=startIndex; i<queue.length; i++){
      currentIndexRef.current = i;

      // Esperar si está pausado
      while(pauseRef.current){
        if(abort.signal.aborted)break;
        await new Promise(res=>setTimeout(res, 400));
      }
      if(abort.signal.aborted)break;

      const target = queue[i];
      const targetLabel = target.label || `${target.locality ? target.locality + ' [C.P.] ' : ''}${target.district} (${target.province}, ${target.region})`;
      const districtProgress = `[${i+1}/${queue.length}] ${targetLabel}`;
      setProgress(`${districtProgress}: Consultando Google Maps…`);
      setAutoProgress(`${districtProgress}: Consultando Google Maps…`);

      const input = {
        country: 'Perú',
        region: target.region,
        province: target.province,
        city: target.province,
        district: target.district,
        locality: target.locality || '',
        sector: sectorName,
        offset: 0
      };

      let districtResults: Row[] = [];
      try {
        const data = await api('search', input, abort.signal);
        const rawResults = data.results || [];

        // Deduplicación en tiempo real (evita empresas duplicadas entre distritos/centros poblados)
        const uniqueResults: Row[] = [];
        for (const item of rawResults) {
          if (!isDuplicateRecord(item, seenMapsIdsRef.current, seenPhonesRef.current, seenNamesRef.current)) {
            registerSeenRecord(item, seenMapsIdsRef.current, seenPhonesRef.current, seenNamesRef.current);
            uniqueResults.push(item);
          }
        }
        districtResults = uniqueResults;

        if(withEmails && districtResults.length && !abort.signal.aborted){
          setProgress(`${districtProgress}: Buscando correos en webs (${districtResults.length} empresas)…`);
          setAutoProgress(`${districtProgress}: Buscando correos en webs…`);
          const pending = districtResults.filter(r=>r.web);
          for(let j=0;j<pending.length;j+=3){
            if(abort.signal.aborted || pauseRef.current)break;
            await Promise.all(pending.slice(j,j+3).map(async r=>{
              try{
                const info=await api('enrich',{web:r.web},abort.signal);
                districtResults=districtResults.map(item=>item.mapsId===r.mapsId?{...item,...info}:item);
              }catch(e){}
            }));
          }
        }

        if(districtResults.length > 0){
          if(autoDownloadCSV) {
            const fileLoc = target.locality ? `${target.district}_${target.locality}` : target.district;
            downloadRowsCSV(districtResults, sectorName, `${target.region}_${target.province}_${fileLoc}`, 'prospectos');
          }
          setAutoHistory(prev=>[{district:targetLabel,count:districtResults.length,downloaded:autoDownloadCSV,rows:districtResults},...prev]);
          setAutoAccumulated(prev=>[...prev,...districtResults]);
          setResults(prev=>[...districtResults,...prev.filter(r=>!districtResults.some(d=>d.mapsId===r.mapsId))]);
          const message = `✅ ${districtProgress}: ${districtResults.length} empresas únicas extraídas${autoDownloadCSV?' · CSV descargado':''}`;
          setProgress(message);
          setAutoProgress(message);
        } else {
          setAutoHistory(prev=>[{district:targetLabel,count:0,downloaded:false,rows:[]} ,...prev]);
          const message = `⚪ ${districtProgress}: 0 nuevas empresas encontradas.`;
          setProgress(message);
          setAutoProgress(message);
        }

        // Guardar progreso en almacenamiento local para no perder datos si se recarga la pestaña
        try {
          saveSweepState(queue, i + 1, sectorName, autoScope, nationalType, autoRegion, autoProvince, [...autoAccumulated, ...districtResults], [{district:targetLabel,count:districtResults.length,downloaded:autoDownloadCSV,rows:districtResults}, ...autoHistory], targetLabel);
        } catch(e){}

        // Si hay una siguiente localidad, pausar para proteger la conexión
        if(i < queue.length - 1 && !abort.signal.aborted){
          for(let s=autoDelay; s>0; s--){
            if(abort.signal.aborted)break;
            while(pauseRef.current){
              if(abort.signal.aborted)break;
              await new Promise(res=>setTimeout(res, 400));
            }
            if(abort.signal.aborted)break;
            setCountdown(s);
            const nextTarget = queue[i+1];
            const nextLabel = nextTarget.label || `${nextTarget.district} (${nextTarget.region})`;
            const message = `⏳ Siguiente: ${nextLabel} en ${s}s (Pausa de seguridad)…`;
            setProgress(message);
            setAutoProgress(message);
            await new Promise(res=>setTimeout(res,1000));
          }
          setCountdown(null);
        }
      } catch(err:any){
        if(abort.signal.aborted)break;
        const msg = err.message || 'Error en la consulta';
        const errStatus = err.status || 502;
        setAutoHistory(prev=>[{district:targetLabel,count:0,downloaded:false,rows:[],error:msg},...prev]);
        setError(`Error en ${targetLabel}: ${msg}`);
        const message = `⚠️ Error en ${targetLabel}: ${msg}.`;
        setProgress(message);
        setAutoProgress(message);

        // Si Google aplica límite (429), CAPTCHA, o bloqueo de red
        const isRateLimit = 
          errStatus === 429 || 
          errStatus === 502 || 
          msg.includes('429') || 
          msg.includes('limitado') || 
          msg.includes('verificación') || 
          msg.includes('CAPTCHA') || 
          msg.includes('no permitió') ||
          msg.includes('bloqueo');

        if(isRateLimit){
          rateLimited = true;
          const limitedMessage = `⚠️ Google aplicó un límite temporal o verificación de seguridad (429/502). El barrido se detuvo de inmediato para proteger tu IP. Espera unos minutos y usa el botón "Continuar barrido anterior" para retomar sin perder datos.`;
          setProgress(limitedMessage);
          setAutoProgress(limitedMessage);
          break;
        }
        await new Promise(res=>setTimeout(res,3000));
      }
    }

    setCountdown(null);
    setAutoRunning(false);
    setAutoPaused(false);
    pauseRef.current = false;
    controller.current=null;

    if(abort.signal.aborted || rateLimited){
      if(currentIndexRef.current < queue.length){
        setHasInterruptedSweep(true);
        const lastTarget = queue[currentIndexRef.current];
        const lastLabel = lastTarget?.label || `${lastTarget?.district} (${lastTarget?.region})`;
        setInterruptedTarget(lastLabel);
        saveSweepState(queue, currentIndexRef.current, sectorName, autoScope, nationalType, autoRegion, autoProvince, autoAccumulated, autoHistory, lastLabel);
      }
      const message = autoDownloadCSV
        ?'Barrido detenido. Los resultados procesados están disponibles en el panel y los CSVs descargados están en tu carpeta de descargas.'
        :'Barrido detenido. Los resultados procesados siguen disponibles en el panel para descargar o guardar en Empresas.';
      setProgress(message);
      setAutoProgress(message);
    } else {
      setHasInterruptedSweep(false);
      clearSweepState();
      const message = autoDownloadCSV
        ?'🎉 Barrido completado con éxito. Los CSVs de cada localidad están en tu carpeta de descargas.'
        :'🎉 Barrido completado con éxito. Los resultados están disponibles para descargar en un solo CSV o guardar en Empresas.';
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
      let totalImported=0;
      let totalDuplicates=0;
      for(let i=0;i<autoAccumulated.length;i+=100){
        const batch=autoAccumulated.slice(i,i+100);
        const data=await api('import',{results:batch,service});
        totalImported+=(data.imported||0);
        totalDuplicates+=(data.duplicates||0);
      }
      await onImported();
      setProgress(`${totalImported} empresas del barrido guardadas en CRM · ${totalDuplicates} duplicados omitidos.`);
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
          <Zap size={14}/> Barrido automático (Todo el Perú)
        </button>
        <button type="button" className={`prospecttab ${mode==='manual'?'active':''}`} onClick={()=>setMode('manual')}>
          <Search size={14}/> Búsqueda individual
        </button>
      </div>

      {autoRunning&&(
        <div className="notice prospect-live-status" role="status" aria-live="polite" style={{position:'sticky',top:122,zIndex:5,display:'flex',alignItems:'center',gap:10}}>
          <LoaderCircle className="spin" size={16}/>
          <div style={{flex:1}}>
            <b>{autoPaused ? '⏸️ Barrido Pausado' : `Extracción activa: ${autoSector}`}</b>
            <div>{autoProgress}</div>
            <small>
              {autoHistory.length} localidades procesadas · {autoAccumulated.length} empresas únicas recopiladas
              {queueRef.current.length > 0 ? ` · ${queueRef.current.length - currentIndexRef.current} pendientes` : ''}.
            </small>
          </div>
          <div style={{display:'flex',gap:6}}>
            {!autoPaused ? (
              <button type="button" className="button" onClick={handlePauseSweep}>
                <Pause size={12}/> Pausar
              </button>
            ) : (
              <button type="button" className="button primary" style={{background:'#17634e',color:'#fff'}} onClick={handleResumeSweep}>
                <Play size={12}/> Reanudar
              </button>
            )}
            <button type="button" className="button" onClick={handleStopSweep}>
              <Square size={12}/> Detener
            </button>
          </div>
        </div>
      )}

      {mode==='auto' && (
        <div className="autobox">
          {/* Selector de Cobertura: Por Departamento o Barrido Nacional */}
          <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
            <button 
              type="button" 
              className={`button ${autoScope==='province'?'active':''}`}
              style={{
                background: autoScope==='province' ? '#17634e' : '#fff',
                color: autoScope==='province' ? '#fff' : '#2b4435',
                borderColor: autoScope==='province' ? '#17634e' : '#cfdcd3',
                fontWeight: 600,
                fontSize: 12,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}
              disabled={autoRunning}
              onClick={()=>setAutoScope('province')}
            >
              <MapPin size={14}/> Por Departamento y Provincia
            </button>
            <button 
              type="button" 
              className={`button ${autoScope==='national'?'active':''}`}
              style={{
                background: autoScope==='national' ? '#17634e' : '#fff',
                color: autoScope==='national' ? '#fff' : '#2b4435',
                borderColor: autoScope==='national' ? '#17634e' : '#cfdcd3',
                fontWeight: 600,
                fontSize: 12,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}
              disabled={autoRunning}
              onClick={()=>setAutoScope('national')}
            >
              <Globe size={14}/> 🇵🇪 Barrido Nacional (Todo el Perú)
            </button>
          </div>

          <div className="autoinfobar">
            {autoScope==='province' ? (
              <div>
                <b>🇵🇪 Cobertura: Perú → {autoRegion} → {autoProvince}</b>
                <p>Barre progresivamente todos los distritos y sus centros poblados registrados (ej. Huancabamba → Huarmaca incluye Hualapampa, Rodeopampa, etc.).</p>
              </div>
            ) : (
              <div>
                <b>🇵🇪 Cobertura Nacional: {nationalType === 'all' ? 'Todo el Perú (25 departamentos, 196 provincias, distritos y centros poblados)' : 'Ciudades y Capitales Comerciales Clave'}</b>
                <p>Barre de forma progresiva e inteligente todas las localidades registradas sin requerir tipeo manual.</p>
              </div>
            )}
            <span className="pill">
              {autoScope==='province' 
                ? `${autoDistricts.length} de ${availableDistricts.length} distritos seleccionados` 
                : nationalType === 'all'
                  ? 'Todo el Perú (25 regiones, distritos y centros poblados)'
                  : `${autoNationalTargets.length} de ${TOP_PERU_TARGETS.length} ciudades/distritos seleccionados`}
            </span>
          </div>

          {autoScope==='national' && (
            <div style={{display:'flex',gap:16,alignItems:'center',marginBottom:14,flexWrap:'wrap'}}>
              <span style={{fontSize:12,fontWeight:600,color:'#2b4435'}}>Modalidad del Barrido:</span>
              <label style={{display:'inline-flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:12}}>
                <input 
                  type="radio" 
                  name="nationalType" 
                  value="all" 
                  checked={nationalType === 'all'} 
                  disabled={autoRunning} 
                  onChange={()=>setNationalType('all')} 
                />
                <span><b>Todo el Perú</b> (25 regiones, 196 provincias, distritos y centros poblados)</span>
              </label>
              <label style={{display:'inline-flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:12}}>
                <input 
                  type="radio" 
                  name="nationalType" 
                  value="top" 
                  checked={nationalType === 'top'} 
                  disabled={autoRunning} 
                  onChange={()=>setNationalType('top')} 
                />
                <span><b>Top Ciudades Comerciales</b> ({TOP_PERU_TARGETS.length} zonas clave)</span>
              </label>
            </div>
          )}

          <div className="formgrid" style={{marginBottom:15}}>
            {autoScope==='province' && (
              <>
                <label>
                  Región / Departamento (25 regiones)
                  <select 
                    disabled={autoRunning} 
                    value={autoRegion} 
                    onChange={e => handleRegionChange(e.target.value)}
                  >
                    {peRegions.map(r => (
                      <option key={r.name} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Provincia
                  <select 
                    disabled={autoRunning} 
                    value={autoProvince} 
                    onChange={e => handleProvinceChange(e.target.value)}
                  >
                    {availableProvinces.map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </label>
              </>
            )}

            <label>
              Rubro o actividad comercial
              <input 
                disabled={autoRunning} 
                required 
                value={territory.sector} 
                placeholder="Ej. clínicas dentales, restaurantes, transportes, agencias…" 
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

          {autoScope==='province' && (
            <label className="checkrow" style={{marginBottom:12}}>
              <input 
                type="checkbox" 
                checked={includeLocalities} 
                disabled={autoRunning} 
                onChange={e=>setIncludeLocalities(e.target.checked)}
              />
              <span style={{fontSize:12}}>
                <b>Incluir centros poblados, caseríos y anexos registrados</b> (ej. Huancabamba → Huarmaca incluye Hualapampa, Rodeopampa, Succhirca, Chignia Alta, etc.)
              </span>
            </label>
          )}

          {/* Opciones y listado de selección */}
          {autoScope==='province' ? (
            <>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap',marginTop:8}}>
                <span style={{fontSize:11,fontWeight:600,color:'#395444'}}>
                  Distritos a procesar en {autoProvince} ({availableDistricts.length}):
                </span>
                <div style={{display:'flex',gap:8}}>
                  <button type="button" className="textbutton" disabled={autoRunning} onClick={()=>setAutoDistricts([...availableDistricts])}>
                    Seleccionar todos ({availableDistricts.length})
                  </button>
                  {autoRegion==='Lima'&&autoProvince==='Lima'&&(
                    <button type="button" className="textbutton" disabled={autoRunning} onClick={()=>setAutoDistricts([...TOP_10_DISTRICTS])}>
                      Top 10 comerciales
                    </button>
                  )}
                  <button type="button" className="textbutton" disabled={autoRunning} onClick={()=>setAutoDistricts([])}>
                    Desmarcar todos
                  </button>
                </div>
              </div>

              <div className="districtgrid">
                {availableDistricts.map(d=>(
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
            </>
          ) : (
            nationalType === 'top' && (
              <>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap',marginTop:8}}>
                  <span style={{fontSize:11,fontWeight:600,color:'#395444'}}>
                    Ciudades y distritos comerciales clave del Perú ({autoNationalTargets.length} de {TOP_PERU_TARGETS.length}):
                  </span>
                  <div style={{display:'flex',gap:8}}>
                    <button type="button" className="textbutton" disabled={autoRunning} onClick={()=>setAutoNationalTargets([...TOP_PERU_TARGETS])}>
                      Seleccionar todos ({TOP_PERU_TARGETS.length})
                    </button>
                    <button type="button" className="textbutton" disabled={autoRunning} onClick={()=>setAutoNationalTargets(TOP_PERU_TARGETS.filter(t => t.region !== 'Lima' && t.region !== 'Callao'))}>
                      Solo Provincias ({TOP_PERU_TARGETS.filter(t => t.region !== 'Lima' && t.region !== 'Callao').length})
                    </button>
                    <button type="button" className="textbutton" disabled={autoRunning} onClick={()=>setAutoNationalTargets(TOP_PERU_TARGETS.filter(t => t.region === 'Lima' || t.region === 'Callao'))}>
                      Solo Lima & Callao ({TOP_PERU_TARGETS.filter(t => t.region === 'Lima' || t.region === 'Callao').length})
                    </button>
                    <button type="button" className="textbutton" disabled={autoRunning} onClick={()=>setAutoNationalTargets([])}>
                      Desmarcar todos
                    </button>
                  </div>
                </div>

                <div className="districtgrid">
                  {TOP_PERU_TARGETS.map(t => {
                    const key = `${t.region}-${t.province}-${t.district}`;
                    const isSelected = autoNationalTargets.some(x => x.region === t.region && x.province === t.province && x.district === t.district);
                    return (
                      <label key={key} className="districtitem">
                        <input 
                          type="checkbox" 
                          disabled={autoRunning} 
                          checked={isSelected} 
                          onChange={()=>toggleNationalTarget(t)}
                        />
                        <span><b>{t.district}</b> <small style={{color:'#666'}}>({t.region})</small></span>
                      </label>
                    );
                  })}
                </div>
              </>
            )
          )}

          <div className="prospectcontrols" style={{marginTop:15}}>
            <label className="checkrow">
              <input type="checkbox" checked={withEmails} disabled={autoRunning} onChange={e=>setWithEmails(e.target.checked)}/> 
              Buscar correos en webs publicadas
            </label>

            <label className="checkrow">
              <input type="checkbox" checked={autoDownloadCSV} disabled={autoRunning} onChange={e=>setAutoDownloadCSV(e.target.checked)}/>
              Descargar CSV automáticamente por cada localidad
            </label>

            {!autoRunning ? (
              <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
                <button type="button" className="primary" onClick={()=>runAutoSweep(false)}>
                  <Zap size={16}/> Iniciar nuevo barrido
                </button>
                {hasInterruptedSweep && queueRef.current.length > currentIndexRef.current && (
                  <div style={{display:'inline-flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                    <button 
                      type="button" 
                      className="button" 
                      style={{borderColor:'#17634e',color:'#17634e',fontWeight:600,display:'inline-flex',alignItems:'center',gap:6}} 
                      onClick={()=>runAutoSweep(true)}
                    >
                      <RotateCcw size={14}/> Continuar barrido anterior ({queueRef.current.length - currentIndexRef.current} pendientes desde {interruptedTarget})
                    </button>
                    <button 
                      type="button" 
                      className="textbutton" 
                      style={{color:'#888',fontSize:12,display:'inline-flex',alignItems:'center',gap:4}}
                      onClick={()=>{
                        clearSweepState();
                        setHasInterruptedSweep(false);
                        queueRef.current = [];
                        currentIndexRef.current = 0;
                        setProgress('Barrido guardado descartado.');
                      }}
                      title="Descartar barrido guardado y empezar desde cero"
                    >
                      <Trash2 size={13}/> Descartar
                    </button>
                  </div>
                )}
              </div>
            ) : <span className="pill">Usa los botones Pausar / Reanudar / Detener en el estado de extracción.</span>}
          </div>

          {autoHistory.length > 0 && (
            <div style={{marginTop:20}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <b style={{fontSize:12}}>Localidades procesadas ({autoHistory.length}):</b>
                {autoAccumulated.length > 0 && (
                  <div style={{display:'flex',gap:8}}>
                    <button type="button" className="button" onClick={()=>downloadRowsCSV(autoAccumulated, territory.sector, autoScope==='national'?'Peru_Nacional_Consolidado':`${autoRegion}_${autoProvince}_Consolidado`, 'prospectos')}>
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
                        <button type="button" className="textbutton" onClick={()=>downloadRowsCSV(h.rows, territory.sector, h.district, 'prospectos')}>
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
