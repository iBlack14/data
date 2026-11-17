#!/usr/bin/env node
/**
 * Barrido nacional con Bright Data SERP API — CONCURRENTE.
 * Uso:
 *   node scripts/prospect-brightdata.mjs --sector "hoteles" [--workers 10]
 * Resultados: outputs/brightdata/<sector>/_resultados.jsonl + _progreso.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { searchBrightData } from '../lib/prospecting.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const getArg = (f, d = '') => { const i = args.indexOf(f); return i !== -1 && args[i + 1] ? args[i + 1] : d; };

const sector = getArg('--sector', 'hoteles').trim();
const WORKERS = Number(getArg('--workers', '10'));

const safeSector = sector.toLowerCase().replace(/[^a-z0-9_-]+/gi, '_');
const OUTPUT_DIR = path.join(ROOT, 'outputs', 'brightdata', safeSector);
const PROGRESS_FILE = path.join(OUTPUT_DIR, '_progreso.json');
const RESULTS_FILE = path.join(OUTPUT_DIR, '_resultados.jsonl');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const peGeography = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'geography', 'PE.json'), 'utf8'));

function buildQueue() {
  const q = [];
  for (const dept of peGeography)
    for (const prov of dept.provinces || [])
      for (const dist of prov.districts || [])
        q.push({ country: 'Perú', region: dept.name, province: prov.name, city: prov.name, district: dist });
  return q;
}

const loadJSON = (f, fb) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return fb; } };
const key = it => `${it.region}|${it.province}|${it.district}`;

async function main() {
  const queue = buildQueue();
  const progress = loadJSON(PROGRESS_FILE, { completed: {}, totalFound: 0 });
  const pending = queue.filter(it => !progress.completed[key(it)]);

  console.log(`\n=== BARRIDO BRIGHTDATA: "${sector}" ===`);
  console.log(`Total: ${queue.length} | hechos: ${Object.keys(progress.completed).length} | pendientes: ${pending.length} | workers: ${WORKERS}\n`);

  let idx = 0, done = 0, found = 0;
  const out = fs.createWriteStream(RESULTS_FILE, { flags: 'a' });
  const apiKey = process.env.BRIGHTDATA_API_KEY || '4b8bcc63-1cec-43bd-9588-03c834451507';

  async function worker() {
    while (idx < pending.length) {
      const my = idx++;
      const item = pending[my];
      const k = key(item);
      const query = [...new Set([sector, item.district, item.province, item.region, item.country].filter(Boolean))].join(' ');
      try {
        const data = await searchBrightData({ ...item, sector, offset: 0 }, query, apiKey);
        const rows = data.results || [];
        for (const r of rows) {
          out.write(JSON.stringify({ ...r, _district: item.district, _province: item.province, _department: item.region }) + '\n');
        }
        progress.completed[k] = { count: rows.length, date: new Date().toISOString() };
        progress.totalFound += rows.length;
        found += rows.length;
        console.log(`[${done + 1}/${pending.length}] ${item.district} (${item.province}, ${item.region}) → ${rows.length}`);
      } catch (e) {
        progress.completed[k] = { count: 0, error: String(e.message || e).slice(0, 120), date: new Date().toISOString() };
        console.log(`[${done + 1}/${pending.length}] ${item.district} → ERROR: ${String(e.message || e).slice(0, 100)}`);
      }
      done++;
      if (done % 10 === 0) {
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress));
        console.log(`   …checkpoint: ${done} procesados, ${found} empresas nuevas\n`);
      }
    }
  }

  await Promise.all(Array.from({ length: WORKERS }, worker));
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress));
  await new Promise(r => out.end(r));
  console.log(`\n=== FIN === procesados: ${done} | empresas: ${found} | total histórico: ${progress.totalFound}`);
  console.log(`Resultados: ${RESULTS_FILE}`);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
