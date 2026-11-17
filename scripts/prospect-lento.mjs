#!/usr/bin/env node
/**
 * Barrido nacional lento "modo humano" — SIN Bright Data.
 * Consulta directa a Google Maps (tbm=map) con ritmo de persona:
 *  - Orden aleatorio de distritos
 *  - Delay aleatorio entre consultas
 *  - Pausa larga cada N consultas
 *  - Solo horario configurable (por defecto 8:00 - 21:00)
 *  - Límite diario de localidades
 *  - Si Google bloquea (429/CAPTCHA), espera y reintenta; si persiste, corta hasta el día siguiente
 *
 * Resultados: CSV por distrito + _resultados.json acumulado en outputs/lento/<sector>/
 * Progreso: _progreso.json (se retoma solo)
 *
 * Uso:
 *   node scripts/prospect-lento.mjs --sector "medicos" [--daily 40] [--from 8] [--to 21]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMaps, ProspectError } from '../lib/prospecting.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const getArg = (f, d = '') => { const i = args.indexOf(f); return i !== -1 && args[i + 1] ? args[i + 1] : d; };

const sector = getArg('--sector', 'medicos').trim();
const DAILY_LIMIT = Number(getArg('--daily', '40'));
const HOUR_FROM = Number(getArg('--from', '8'));
const HOUR_TO = Number(getArg('--to', '21'));
const LONG_PAUSE_EVERY = 20;
const LONG_PAUSE_MIN = 15;

const safeSector = sector.toLowerCase().replace(/[^a-z0-9_-]+/gi, '_');
const OUTPUT_DIR = path.join(ROOT, 'outputs', 'lento', safeSector);
const PROGRESS_FILE = path.join(OUTPUT_DIR, '_progreso.json');
const RESULTS_FILE = path.join(OUTPUT_DIR, '_resultados.json');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Parámetros pb de Google Maps (mismo formato que usa la app)
const FIELDS = '!10b1!12m6!1m1!18b1!2m1!20e3!6m1!114b1!17m1!3e1!20m57!2m2!1i203!2i100!3m2!2i4!5b1!6m6!1m2!1i86!2i86!1m2!1i408!2i240!7m33!1m3!1e1!2b0!3e3!1m3!1e2!2b1!3e2!1m3!1e2!2b0!3e3!1m3!1e8!2b0!3e3!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e10!2b0!3e4!1m3!1e9!2b1!3e2!2b1!9b0!15m8!1m7!1m2!1m1!1e2!2m2!1i195!2i195!3i20';

const peGeography = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'geography', 'PE.json'), 'utf8'));

function buildNationalQueue() {
  const queue = [];
  for (const dept of peGeography) {
    for (const prov of dept.provinces || []) {
      for (const dist of prov.districts || []) {
        queue.push({ department: dept.name, province: prov.name, district: dist });
      }
    }
  }
  return queue;
}

function loadJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function saveJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data)); }

const rand = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const sleep = ms => new Promise(r => setTimeout(r, ms));

function inWindow() {
  const h = new Date().getHours();
  return h >= HOUR_FROM && h < HOUR_TO;
}
async function waitForWindow() {
  while (!inWindow()) {
    const now = new Date();
    const next = new Date(now);
    next.setHours(HOUR_FROM, randInt(0, 30), 0, 0);
    if (now >= next) next.setDate(next.getDate() + 1);
    const waitMin = Math.max(5, Math.round((next - now) / 60000));
    console.log(`\n🌙 Fuera de horario (${HOUR_FROM}:00-${HOUR_TO}:00). Durmiendo ~${waitMin} min hasta mañana ${HOUR_FROM}:${String(next.getMinutes()).padStart(2,'0')}…`);
    await sleep(waitMin * 60000);
  }
}

async function readLimited(response, maxBytes = 3_000_000) {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const chunks = []; let size = 0;
  try {
    for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > maxBytes) { await reader.cancel(); throw new ProspectError('La página supera el límite de lectura.'); } chunks.push(value); }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return new TextDecoder().decode(bytes);
}

// Búsqueda directa a Google Maps SIN Bright Data
async function searchDirect({ country, region, province, city, district, sector }) {
  const query = [...new Set([sector, district, city, province, region, country].filter(Boolean))].join(' ');
  const gl = ({ 'Perú': 'pe', 'México': 'mx', 'Colombia': 'co', 'Chile': 'cl', 'Argentina': 'ar', 'Ecuador': 'ec', 'Bolivia': 'bo', 'España': 'es' })[country] || '';
  const url = new URL('https://www.google.com/search');
  url.search = new URLSearchParams({ tbm: 'map', hl: 'es', ...(gl ? { gl } : {}), q: query, pb: `!1s${query}!7i20!8i0${FIELDS}` }).toString();
  const response = await fetch(url, { headers: { 'Accept-Language': 'es' }, signal: AbortSignal.timeout(25000), redirect: 'manual' });
  const location = response.headers.get('location') || '';
  if (response.status === 429 || response.status === 403 || location.includes('/sorry/') || location.includes('google.com/sorry')) {
    const err = new ProspectError('RATE_LIMIT', 429); err.isRateLimit = true; throw err;
  }
  if (!response.ok) throw new ProspectError(`Google respondió ${response.status}`, 502);
  const results = parseMaps(await readLimited(response));
  const extractedAt = new Date().toISOString();
  return results.slice(0, 20).map(r => ({
    ...r, extractedAt,
    searchTerritory: { country, region, province, city, district, sector },
    locationOrigin: 'search',
    emailStatus: r.web ? 'Pendiente' : 'Sin web'
  }));
}

function sanitizeName(str) {
  return (str || '').trim().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '_');
}

function saveDistrictCSV(rows, item) {
  if (!rows?.length) return null;
  const headers = ['Empresa', 'Rubro', 'País', 'Departamento', 'Provincia', 'Ciudad', 'Distrito', 'Correo', 'Teléfono', 'Dirección', 'Web', 'Calificación', 'Reseñas', 'Fuente Google Maps', 'Fecha Extracción'];
  const csvRows = [headers, ...rows.map(r => [
    r.name || '', r.sector || sector, 'Perú', item.department, item.province, item.province, item.district,
    r.email || '', r.phone || '', r.address || '', r.web || '',
    r.rating ?? '', r.reviewCount ?? '', r.source || '', r.extractedAt || ''
  ])];
  const content = '﻿sep=;\r\n' + csvRows.map(row => row.map(v => `"${String(v ?? '').replaceAll('"', '""')}"`).join(';')).join('\r\n');
  const fn = `Peru_${sanitizeName(item.department)}_${sanitizeName(item.province)}_${sanitizeName(item.district)}.csv`;
  fs.writeFileSync(path.join(OUTPUT_DIR, fn), content, 'utf8');
  return fn;
}

async function main() {
  const allQueue = buildNationalQueue();
  const progress = loadJSON(PROGRESS_FILE, { completed: {}, order: [], totalFound: 0, blockedStreak: 0 });
  let resultsAll = loadJSON(RESULTS_FILE, []);

  // Orden aleatorio estable: si no hay orden guardado, barajar y guardar
  if (!Array.isArray(progress.order) || progress.order.length !== allQueue.length) {
    progress.order = allQueue.map((_, i) => i);
    for (let i = progress.order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [progress.order[i], progress.order[j]] = [progress.order[j], progress.order[i]];
    }
    saveJSON(PROGRESS_FILE, progress);
  }

  const pending = progress.order.map(i => allQueue[i]).filter(item => !progress.completed[`${item.department}|${item.province}|${item.district}`]);
  console.log(`\n=== BARRIDO LENTO: "${sector}" ===`);
  console.log(`Total distritos: ${allQueue.length} | ya hechos: ${Object.keys(progress.completed).length} | pendientes: ${pending.length}`);
  console.log(`Límite hoy: ${DAILY_LIMIT} | Horario: ${HOUR_FROM}:00-${HOUR_TO}:00 | Resultados acumulados: ${resultsAll.length}\n`);

  let doneToday = 0, sinceLongPause = 0, consecBlocks = 0;

  for (const item of pending) {
    if (doneToday >= DAILY_LIMIT) { console.log(`\n✅ Llegué al límite diario (${DAILY_LIMIT}). Mañana retomo.`); break; }
    await waitForWindow();

    const key = `${item.department}|${item.province}|${item.district}`;
    const label = `${item.district} (${item.province}, ${item.department})`;
    console.log(`[${new Date().toLocaleTimeString('es-PE')}] (${doneToday + 1}/${DAILY_LIMIT} hoy) ${label} …`);

    let ok = false;
    for (let attempt = 0; attempt < 3 && !ok; attempt++) {
      try {
        const rows = await searchDirect({ country: 'Perú', region: item.department, province: item.province, city: item.province, district: item.district, sector });
        const file = saveDistrictCSV(rows, item);
        progress.completed[key] = { count: rows.length, file, date: new Date().toISOString() };
        resultsAll.push(...rows.map(r => ({ ...r, _district: item.district, _province: item.province, _department: item.department })));
        saveJSON(RESULTS_FILE, resultsAll);
        saveJSON(PROGRESS_FILE, progress);
        console.log(`   → ${rows.length} empresas${file ? ' · ' + file : ''}`);
        ok = true; consecBlocks = 0;
      } catch (e) {
        if (e.isRateLimit || e.status === 429) {
          consecBlocks++;
          const waitMin = consecBlocks >= 2 ? 120 : 30;
          console.log(`   ⚠️ BLOQUEO de Google (intento ${attempt + 1}). Esperando ${waitMin} min antes de reintentar…`);
          await sleep(waitMin * 60000);
          if (consecBlocks >= 3) { console.log('   🛑 Bloqueo persistente. Corto hasta la próxima sesión.'); return finish(); }
        } else {
          console.log(`   ❌ Error: ${e.message}`);
          await sleep(rand(4000, 9000));
          ok = true; // error no relacionado a rate limit: marcar como fallado y seguir
          progress.completed[key] = { count: 0, file: null, error: e.message, date: new Date().toISOString() };
          saveJSON(PROGRESS_FILE, progress);
        }
      }
    }
    if (!ok) { progress.completed[key] = { count: 0, file: null, error: 'rate_limit', date: new Date().toISOString() }; saveJSON(PROGRESS_FILE, progress); }

    doneToday++; sinceLongPause++;

    // Pausa larga cada LONG_PAUSE_EVERY consultas (solo si aún queda horario)
    if (sinceLongPause >= LONG_PAUSE_EVERY && doneToday < DAILY_LIMIT) {
      const mins = randInt(LONG_PAUSE_MIN, LONG_PAUSE_MIN + 15);
      console.log(`   ☕ Pausa larga de ~${mins} min (cada ${LONG_PAUSE_EVERY} consultas)…`);
      const end = Date.now() + mins * 60000;
      while (Date.now() < end) await sleep(Math.min(60000, end - Date.now()));
      sinceLongPause = 0;
    } else {
      // Delay humano aleatorio entre consultas
      const secs = randInt(30, 240);
      await sleep(secs * 1000);
    }
  }
  finish();

  async function finish() {
    const done = Object.keys(progress.completed).length;
    console.log(`\n=== RESUMEN ===`);
    console.log(`Distritos procesados: ${done}/${allQueue.length} | Empresas acumuladas: ${resultsAll.length}`);
    console.log(`Archivos en: ${OUTPUT_DIR}`);
    console.log(`Siguiente ejecución retoma automáticamente donde quedó.\n`);
    process.exit(0);
  }
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
