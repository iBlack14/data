#!/usr/bin/env node
/**
 * Script de barrido automático por distritos de Lima Metropolitana
 * Uso:
 *   node scripts/prospect-lima.mjs --sector "clínicas dentales" [--delay 5] [--no-emails]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { searchMaps, findWebsiteEmails } from '../lib/prospecting.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'outputs', 'lima');

const LIMA_DISTRICTS = [
  "Ancón", "Ate", "Barranco", "Breña", "Carabayllo", "Chaclacayo", "Chorrillos", "Cieneguilla",
  "Comas", "El Agustino", "Independencia", "Jesús María", "La Molina", "La Victoria", "Lima",
  "Lince", "Los Olivos", "Lurigancho", "Lurín", "Magdalena del Mar", "Miraflores", "Pachacámac",
  "Pucusana", "Pueblo Libre", "Puente Piedra", "Punta Hermosa", "Punta Negra", "Rímac",
  "San Bartolo", "San Borja", "San Isidro", "San Juan de Lurigancho", "San Juan de Miraflores",
  "San Luis", "San Martín de Porres", "San Miguel", "Santa Anita", "Santa María del Mar",
  "Santa Rosa", "Santiago de Surco", "Surquillo", "Villa El Salvador", "Villa María del Triunfo"
];

const args = process.argv.slice(2);
function getArg(flag, defaultValue = '') {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultValue;
}

const sector = getArg('--sector', 'clínicas dentales');
const delaySeconds = Number(getArg('--delay', '5'));
const withEmails = !args.includes('--no-emails');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function saveCSV(rows, sectorName, districtName) {
  if (!rows || !rows.length) return null;
  const headers = ['Empresa', 'Rubro', 'País', 'Región', 'Provincia', 'Ciudad', 'Distrito', 'Correo', 'Teléfono', 'Dirección', 'Web', 'Calificación', 'Reseñas', 'Fuente Google Maps', 'Fecha Extracción'];

  const csvRows = [
    headers,
    ...rows.map(r => [
      r.name || '',
      r.sector || sectorName,
      'Perú',
      'Lima',
      'Lima',
      'Lima',
      districtName,
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

  const csvContent = '\uFEFF' + csvRows.map(row => 
    row.map(val => {
      const s = String(val ?? '');
      return '"' + (/^[=+@\-]/.test(s) ? "'" : '') + s.replaceAll('"', '""') + '"';
    }).join(',')
  ).join('\r\n');

  const safeSector = sectorName.trim().toLowerCase().replace(/[^a-z0-9_-]+/gi, '_');
  const safeDistrict = districtName.trim().toLowerCase().replace(/[^a-z0-9_-]+/gi, '_');
  const filename = `${safeSector}_Lima_${safeDistrict}.csv`;
  const filePath = path.join(OUTPUT_DIR, filename);

  fs.writeFileSync(filePath, csvContent, 'utf8');
  return filePath;
}

async function main() {
  console.log(`\n======================================================`);
  console.log(`🚀 BARRIDO DE PROSPECCIÓN AUTOMÁTICA - LIMA METROPOLITANA`);
  console.log(`======================================================`);
  console.log(`📍 Ubicación fijada: Perú > Lima > Lima`);
  console.log(`🏷️  Rubro: "${sector}"`);
  console.log(`⏱️  Pausa entre distritos: ${delaySeconds}s`);
  console.log(`📧 Búsqueda de correos: ${withEmails ? 'Activada' : 'Desactivada'}`);
  console.log(`📁 Carpeta de salida: ${OUTPUT_DIR}`);
  console.log(`📋 Total distritos: ${LIMA_DISTRICTS.length}\n`);

  let totalEmpresas = 0;
  let distritosProcesados = 0;
  const consolidado = [];

  for (let i = 0; i < LIMA_DISTRICTS.length; i++) {
    const district = LIMA_DISTRICTS[i];
    console.log(`[${i + 1}/${LIMA_DISTRICTS.length}] 🔍 Consultando ${district}...`);

    try {
      const searchData = await searchMaps({
        country: 'Perú',
        region: 'Lima',
        province: 'Lima',
        city: 'Lima',
        district,
        sector,
        offset: 0
      });

      let results = searchData.results || [];

      if (withEmails && results.length) {
        process.stdout.write(`   Enriqueciendo correos para ${results.filter(r => r.web).length} webs...`);
        for (let j = 0; j < results.length; j++) {
          if (results[j].web) {
            try {
              const emailInfo = await findWebsiteEmails(results[j].web);
              results[j] = { ...results[j], ...emailInfo };
            } catch (err) {}
          }
        }
        process.stdout.write(` Listo.\n`);
      }

      if (results.length > 0) {
        const file = saveCSV(results, sector, district);
        totalEmpresas += results.length;
        consolidado.push(...results);
        console.log(`   ✅ ${results.length} empresas encontradas. Guardado en: ${path.basename(file)}`);
      } else {
        console.log(`   ⚪ 0 empresas encontradas.`);
      }

      distritosProcesados++;

      if (i < LIMA_DISTRICTS.length - 1) {
        process.stdout.write(`   ⏳ Esperando ${delaySeconds}s antes del siguiente distrito... `);
        await new Promise(r => setTimeout(r, delaySeconds * 1000));
        process.stdout.write(`Listo.\n\n`);
      }
    } catch (err) {
      console.error(`   ❌ Error en ${district}: ${err.message}`);
      if (err.message.includes('429') || err.message.includes('limitado')) {
        console.error(`\n⚠️ Google ha aplicado una limitación de consultas. Deteniendo el barrido.`);
        break;
      }
      await new Promise(r => setTimeout(r, 4000));
    }
  }

  if (consolidado.length > 0) {
    const totalFile = saveCSV(consolidado, sector, 'Metropolitana_Consolidado');
    console.log(`\n======================================================`);
    console.log(`🎉 BARRIDO FINALIZADO`);
    console.log(`📊 Total distritos con resultados: ${distritosProcesados}`);
    console.log(`🏢 Total empresas recopiladas: ${totalEmpresas}`);
    console.log(`📦 Archivo consolidado: ${path.basename(totalFile)}`);
    console.log(`📂 Todos los CSVs guardados en: ${OUTPUT_DIR}`);
    console.log(`======================================================\n`);
  }
}

main().catch(console.error);

