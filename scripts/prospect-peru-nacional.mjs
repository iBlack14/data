#!/usr/bin/env node
/**
 * Script de Barrido Nacional Completo del Perú (1,892 distritos)
 * Comenzando estrictamente por Lima Metropolitana distrito por distrito,
 * y luego recorriendo todas las provincias y distritos del Perú.
 *
 * Cada distrito genera su propio archivo CSV:
 *   outputs/peru/[sector]/Peru_[Departamento]_[Provincia]_[Distrito].csv
 *
 * Posee guardado de estado (_progreso.json) para reanudar automáticamente
 * sin duplicar trabajo en caso de pausa o reinicio.
 *
 * Uso:
 *   node scripts/prospect-peru-nacional.mjs --sector "clínicas dentales" [--delay 5] [--no-emails]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { searchMaps, findWebsiteEmails } from '../lib/prospecting.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
function getArg(flag, defaultValue = '') {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultValue;
}

const sector = getArg('--sector', '').trim();
if (!sector) {
  console.error('\n❌ Debes indicar el rubro a buscar con --sector "nombre del rubro"');
  console.error('Ejemplo: node scripts/prospect-peru-nacional.mjs --sector "clínicas dentales"\n');
  process.exit(1);
}

const delaySeconds = Number(getArg('--delay', '5'));
const withEmails = !args.includes('--no-emails');

const safeSector = sector.toLowerCase().replace(/[^a-z0-9_-]+/gi, '_');
const OUTPUT_DIR = path.join(ROOT, 'outputs', 'peru', safeSector);
const PROGRESS_FILE = path.join(OUTPUT_DIR, '_progreso.json');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Cargar catálogo geográfico completo de Perú
const peGeography = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'geography', 'PE.json'), 'utf8'));

// Construir la cola de distritos ordenada:
// 1. PRIMERO: Lima Metropolitana (Departamento Lima -> Provincia Lima -> Distritos)
// 2. SEGUNDO: Resto de provincias del Departamento de Lima
// 3. TERCERO: Todos los demás 24 departamentos de Perú
function buildNationalQueue() {
  const queue = [];

  // 1. Lima Metropolitana
  const deptLima = peGeography.find(r => r.name.toLowerCase() === 'lima');
  const provLima = deptLima?.provinces.find(p => p.name.toLowerCase() === 'lima');
  if (provLima) {
    for (const dist of provLima.districts) {
      queue.push({
        department: 'Lima',
        province: 'Lima',
        district: dist,
        isMetropolitana: true
      });
    }
  }

  // 2. Otras provincias del departamento de Lima
  if (deptLima) {
    for (const prov of deptLima.provinces) {
      if (prov.name.toLowerCase() === 'lima') continue;
      for (const dist of prov.districts) {
        queue.push({
          department: 'Lima',
          province: prov.name,
          district: dist,
          isMetropolitana: false
        });
      }
    }
  }

  // 3. Los demás 24 departamentos
  for (const dept of peGeography) {
    if (dept.name.toLowerCase() === 'lima') continue;
    for (const prov of dept.provinces || []) {
      for (const dist of prov.districts || []) {
        queue.push({
          department: dept.name,
          province: prov.name,
          district: dist,
          isMetropolitana: false
        });
      }
    }
  }

  return queue;
}

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    } catch {}
  }
  return { completed: {}, totalFound: 0, lastUpdated: new Date().toISOString() };
}

function saveProgress(progress) {
  progress.lastUpdated = new Date().toISOString();
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8');
}

function sanitizeName(str) {
  return (str || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '_');
}

function saveDistrictCSV(rows, sectorName, item) {
  if (!rows || !rows.length) return null;
  const headers = ['Empresa', 'Rubro', 'País', 'Departamento', 'Provincia', 'Ciudad', 'Distrito', 'Correo', 'Teléfono', 'Dirección', 'Web', 'Calificación', 'Reseñas', 'Fuente Google Maps', 'Fecha Extracción'];

  const csvRows = [
    headers,
    ...rows.map(r => [
      r.name || '',
      r.sector || sectorName,
      'Perú',
      item.department,
      item.province,
      item.province,
      item.district,
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

  const csvContent = '\uFEFFsep=;\r\n' + csvRows.map(row => 
    row.map(val => {
      const s = String(val ?? '');
      return '"' + s.replaceAll('"', '""') + '"';
    }).join(';')
  ).join('\r\n');

  const deptSafe = sanitizeName(item.department);
  const provSafe = sanitizeName(item.province);
  const distSafe = sanitizeName(item.district);
  const filename = `Peru_${deptSafe}_${provSafe}_${distSafe}.csv`;
  const filePath = path.join(OUTPUT_DIR, filename);

  fs.writeFileSync(filePath, csvContent, 'utf8');
  return { filePath, filename };
}

async function runNationalSweep() {
  const queue = buildNationalQueue();
  const progress = loadProgress();

  console.log(`\n================================================================`);
  console.log(`🇵🇪 BARRIDO NACIONAL COMPLETO - TODO EL PERÚ (${queue.length} DISTRITOS)`);
  console.log(`================================================================`);
  console.log(`🏷️  Rubro: "${sector}"`);
  console.log(`📍 Secuencia: 1° Lima Metropolitana (43 distritos) → 2° Resto de Provincias de Lima → 3° Todo el Perú`);
  console.log(`⏱️  Pausa de cortesía: ${delaySeconds}s entre distritos`);
  console.log(`📧 Enriquecimiento de correos en web: ${withEmails ? 'Activado' : 'Desactivado'}`);
  console.log(`📂 Directorio de salida: ${OUTPUT_DIR}`);
  console.log(`🔁 Progreso previo: ${Object.keys(progress.completed).length} distritos ya procesados`);
  console.log(`================================================================\n`);

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    const key = `${item.department}|${item.province}|${item.district}`;

    // Si ya fue procesado en una corrida anterior, se salta
    if (progress.completed[key]) {
      continue;
    }

    const tag = item.isMetropolitana ? '⭐ [LIMA METROPOLITANA]' : `[${item.department} > ${item.province}]`;
    console.log(`[${i + 1}/${queue.length}] ${tag} ${item.district}: Consultando Google Maps...`);

    try {
      const searchData = await searchMaps({
        country: 'Perú',
        region: item.department,
        province: item.province,
        city: item.province,
        district: item.district,
        sector,
        offset: 0
      });

      let results = searchData.results || [];

      if (withEmails && results.length) {
        process.stdout.write(`   Enriqueciendo correos en ${results.filter(r => r.web).length} páginas web...`);
        for (let j = 0; j < results.length; j++) {
          if (results[j].web) {
            try {
              const emailInfo = await findWebsiteEmails(results[j].web);
              results[j] = { ...results[j], ...emailInfo };
            } catch {}
          }
        }
        process.stdout.write(` Listo.\n`);
      }

      if (results.length > 0) {
        const saved = saveDistrictCSV(results, sector, item);
        progress.totalFound += results.length;
        progress.completed[key] = { count: results.length, file: saved.filename, date: new Date().toISOString() };
        console.log(`   ✅ ${results.length} empresas encontradas. Archivo generado: ${saved.filename}`);
      } else {
        progress.completed[key] = { count: 0, file: null, date: new Date().toISOString() };
        console.log(`   ⚪ 0 empresas encontradas.`);
      }

      saveProgress(progress);

      // Pausa entre distritos para proteger la IP
      if (i < queue.length - 1) {
        process.stdout.write(`   ⏳ Pausa de seguridad (${delaySeconds}s)... `);
        await new Promise(r => setTimeout(r, delaySeconds * 1000));
        process.stdout.write(`Listo.\n\n`);
      }

    } catch (err) {
      console.error(`   ❌ Error en ${item.district}: ${err.message}`);
      if (err.message.includes('429') || err.message.includes('limitado')) {
        console.error(`\n⚠️ Google ha activado un límite temporal. El progreso quedó guardado en _progreso.json.`);
        console.error(`Puedes reanudar en cualquier momento ejecutando el mismo comando.\n`);
        break;
      }
      // Error recuperable, pausar 4s y seguir con el siguiente
      await new Promise(r => setTimeout(r, 4000));
    }
  }

  console.log(`\n================================================================`);
  console.log(`🏁 ESTADO DE LA PROSPECCIÓN NACIONAL`);
  console.log(`📊 Distritos procesados hasta ahora: ${Object.keys(progress.completed).length} de ${queue.length}`);
  console.log(`🏢 Total empresas recopiladas: ${progress.totalFound}`);
  console.log(`📂 Todos los CSVs están en: ${OUTPUT_DIR}`);
  console.log(`================================================================\n`);
}

runNationalSweep().catch(console.error);

