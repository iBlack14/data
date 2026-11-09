import fs from 'node:fs';
import path from 'node:path';

const dir = 'outputs/peru/abogados';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.csv') && !f.startsWith('00_'));

console.log(`Consolidando ${files.length} archivos CSV...`);

const header = '"Empresa";"Rubro";"País";"Departamento";"Provincia";"Ciudad";"Distrito";"Correo";"Teléfono";"Dirección";"Web";"Calificación";"Reseñas";"Fuente Google Maps";"Fecha Extracción"';
const allRows = [];
const seenMapsId = new Set();

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const lines = content.split(/\r?\n/).filter(l => {
    const trimmed = l.trim();
    return trimmed.length > 0 && !trimmed.startsWith('sep=') && !trimmed.startsWith('\uFEFFsep=') && !trimmed.startsWith('"Empresa"');
  });
  for (const line of lines) {
    // Evitar duplicados exactos si una empresa sale en dos distritos limítrofes
    if (!allRows.includes(line)) {
      allRows.push(line);
    }
  }
}

const masterContent = '\uFEFFsep=;\r\n' + header + '\r\n' + allRows.join('\r\n') + '\r\n';
const masterPath = path.join(dir, '00_PERU_CONSOLIDADO_ABOGADOS.csv');
fs.writeFileSync(masterPath, masterContent, 'utf8');

console.log(`✅ Archivo consolidado creado: 00_PERU_CONSOLIDADO_ABOGADOS.csv con ${allRows.length} registros únicos.`);
