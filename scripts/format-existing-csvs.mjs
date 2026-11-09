import fs from 'node:fs';
import path from 'node:path';

const dir = 'outputs/peru/abogados';
if (!fs.existsSync(dir)) {
  console.log('No directory found');
  process.exit(0);
}

const files = fs.readdirSync(dir).filter(f => f.endsWith('.csv'));
console.log(`Re-formateando ${files.length} archivos CSV para Excel...`);

function parseCSVLine(text) {
  const result = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((c === ',' || c === ';') && !inQuotes) {
      result.push(cell);
      cell = '';
    } else {
      cell += c;
    }
  }
  result.push(cell);
  return result;
}

let modified = 0;
for (const file of files) {
  const filePath = path.join(dir, file);
  let raw = fs.readFileSync(filePath, 'utf8');
  if (raw.startsWith('sep=;\r\n') || raw.startsWith('\uFEFFsep=;\r\n')) {
    continue; // Ya formateado
  }
  raw = raw.replace(/^\uFEFF/, '').replace(/^sep=[,;]\r?\n/, '');
  const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (!lines.length) continue;

  const newRows = lines.map(line => {
    const cols = parseCSVLine(line);
    return cols.map(c => {
      let val = c.replace(/^'/, ''); // Limpiar comilla de escape si existía
      return '"' + val.replaceAll('"', '""') + '"';
    }).join(';');
  });

  const formatted = '\uFEFFsep=;\r\n' + newRows.join('\r\n') + '\r\n';
  fs.writeFileSync(filePath, formatted, 'utf8');
  modified++;
}

console.log(`✅ ${modified} archivos CSV actualizados con formato optimizado para Excel.`);
