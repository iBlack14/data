import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
const sector = process.argv.includes('--ferreterias') ? 'ferreterias' : 'turismo';
const dir = path.join(root, `outputs/brightdata/${sector}_peru`);
fs.mkdirSync(path.join(dir, 'raw'), { recursive: true });
const source = fs.readFileSync(path.join(root, 'lib/prospecting.mjs'), 'utf8');
const apiKey = process.env.BRIGHTDATA_API_KEY || source.match(/apiKey = process.env.BRIGHTDATA_API_KEY \|\| '([^']+)'/)?.[1];
if (!apiKey) throw new Error('Falta BRIGHTDATA_API_KEY');
const geography = JSON.parse(fs.readFileSync(path.join(root, 'public/geography/PE.json'), 'utf8'));
const terms = sector === 'ferreterias'
  ? ['ferreterías', 'ferretería industrial', 'distribuidora de ferretería', 'materiales de construcción']
  : ['agencias de viajes', 'operadores turísticos', 'agencias de turismo', 'tours y excursiones'];
const queue = [];
// Round robin: every department is searched before going deeper in any one.
const provinces = geography.map(d => (d.provinces || []).map(p => ({ department: d.name, province: p.name })));
for (let i = 0; provinces.some(p => p[i]); i++) for (const p of provinces) if (p[i]) queue.push(p[i]);
const districts = geography.map(d => (d.provinces || []).flatMap(p => (p.districts || []).map(district => ({ department: d.name, province: p.name, district }))));
const territories = [...queue];
for (let i = 0; districts.some(p => p[i]); i++) for (const p of districts) if (p[i]) territories.push(p[i]);
const jobs = terms.flatMap(term => territories.map(territory => ({ term, ...territory })));
const stateFile = path.join(dir, '_progreso.json');
const load = (file, fallback) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } };
const state = load(stateFile, { completed: {}, errors: {}, requests: 0, records: 0 });
const hash = value => crypto.createHash('sha256').update(value).digest('hex').slice(0, 24);
const records = new Map();
const resultFile = path.join(dir, '_resultados.jsonl');
if (fs.existsSync(resultFile)) for (const line of fs.readFileSync(resultFile, 'utf8').split('\n').filter(Boolean)) { const row = JSON.parse(line); records.set(row.id, row); }
function save() {
  state.uniqueRecords = records.size; state.totalJobs = jobs.length; state.updatedAt = new Date().toISOString();
  fs.writeFileSync(stateFile + '.tmp', JSON.stringify(state, null, 2)); fs.renameSync(stateFile + '.tmp', stateFile);
  const fields = ['id','name','phone','address','website','category','rating','reviews','mapsUrl','department','province','district','query','section'];
  const esc = v => '"' + String(v ?? '').replaceAll('"', '""') + '"';
  fs.writeFileSync(path.join(dir, 'empresas.csv'), '\ufeff' + fields.join(',') + '\n' + [...records.values()].map(r => fields.map(f => esc(r[f])).join(',')).join('\n'));
}
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let cursor = 0;
state.status = 'running';
async function requestPage(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      state.requests++;
      const res = await fetch('https://api.brightdata.com/request', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey }, body: JSON.stringify({ zone: process.env.BRIGHTDATA_ZONE || 'serp_api1', url, format: 'raw', data_format: 'parsed_json' }), signal: AbortSignal.timeout(90000) });
      if (!res.ok) {
        const err = new Error(`Bright Data HTTP ${res.status}`);
        err.accountIssue = [401, 402, 403].includes(res.status);
        throw err;
      }
      const text = await res.text();
      if (!text.trim()) throw new Error('Bright Data devolvió contenido vacío');
      const data = JSON.parse(text);
      if (data.error || data.errors) throw new Error('Respuesta de error del proveedor');
      return data;
    } catch (err) {
      if (err.accountIssue || attempt === 3) throw err;
      const delay = 30000 * 2 ** attempt;
      console.error(`Reintento ${attempt + 1}/3 en ${delay / 1000}s: ${err.message}`);
      await pause(delay);
    }
  }
}
async function worker() {
  while (cursor < jobs.length) {
    const job = jobs[cursor++]; const jobId = hash(JSON.stringify(job));
    if (state.completed[jobId]) continue;
    if (Date.parse(state.errors[jobId]?.retryAt || '') > Date.now()) continue;
    const query = [...new Set([job.term, job.district, job.province, job.department, 'Perú'].filter(Boolean))].join(' ');
    try {
      let count = 0;
      for (let page = 0; page < 6; page++) {
        const pageId = `${jobId}_${page}`;
        const file = path.join(dir, 'raw', pageId + '.json');
        let data;
        if (fs.existsSync(file)) data = JSON.parse(fs.readFileSync(file, 'utf8'));
        else {
          const url = 'https://www.google.com/search?' + new URLSearchParams({ q: query, hl: 'es', gl: 'pe', tbm: 'lcl', start: String(page * 20) });
          data = await requestPage(url);
          fs.writeFileSync(file, JSON.stringify({ ...data, _context: { ...job, query, page, extractedAt: new Date().toISOString() } }, null, 2));
        }
        let pageFound = 0;
        for (const section of ['snack_pack', 'local_results', 'maps', 'local', 'places']) {
          const items = Array.isArray(data[section]) ? data[section] : data[section]?.results;
          if (!Array.isArray(items)) continue;
          for (const item of items) {
            const name = item.name || item.title; if (!name) continue;
            pageFound++;
            const mapsUrl = item.maps_link || item.maps_url || item.link || '';
            const id = String(item.cid || item.place_id || item.fid || hash(name.toLowerCase() + '|' + (item.address || '') + '|' + (item.phone || '')));
            const row = { id, name, phone: item.phone || '', address: item.address || '', website: item.website || item.url || '', category: item.type || item.category || '', rating: item.rating ?? '', reviews: item.reviews_cnt ?? item.reviews_count ?? '', mapsUrl, ...job, query, section, extractedAt: new Date().toISOString(), rawFile: path.relative(dir, file), raw: item };
            if (!records.has(id)) { records.set(id, row); fs.appendFileSync(resultFile, JSON.stringify(row) + '\n'); state.records++; count++; }
          }
        }
        // Preserve all sections in raw; only factual local business listings enter CSV.
        if (!pageFound || (!data.pagination?.next_page && pageFound < 20)) break;
      }
      state.completed[jobId] = { ...job, newRecords: count, date: new Date().toISOString() }; delete state.errors[jobId];
      console.log(`${Object.keys(state.completed).length}/${jobs.length} ${query}: +${count}; únicos=${records.size}`);
    } catch (err) {
      const attempts = (state.errors[jobId]?.attempts || 0) + 1;
      const delay = err.accountIssue ? 1800000 : Math.min(600000, 60000 * 2 ** Math.min(attempts, 4));
      state.errors[jobId] = { ...job, error: err.message, attempts, retryAt: new Date(Date.now() + delay).toISOString() };
      console.error(query + ': ' + err.message + '; se volverá a intentar automáticamente');
      save();
      await pause(delay);
    }
    save();
  }
}
console.log(`Inicio: ${jobs.length} consultas territoriales; ${geography.length} departamentos; 4 términos; máximo 6 páginas por consulta.`);
save();
while (Object.keys(state.completed).length < jobs.length) {
  cursor = 0;
  await Promise.all(Array.from({ length: 2 }, worker));
  save();
  if (Object.keys(state.completed).length < jobs.length) {
    console.log('Nueva revisión automática de consultas pendientes en 60s');
    await pause(60000);
  }
}
state.status = 'complete';
save();
console.log('BARRIDO FINALIZADO');
