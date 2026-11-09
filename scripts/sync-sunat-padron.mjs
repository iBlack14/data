import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { spawn } from 'node:child_process';

const SUNAT_ZIP_URL = 'http://www2.sunat.gob.pe/padron_reducido_ruc.zip';
const DATA_DIR = path.join(process.cwd(), 'data');
const ZIP_PATH = path.join(DATA_DIR, 'padron_reducido_ruc.zip');
const TXT_PATH = path.join(DATA_DIR, 'padron_reducido_ruc.txt');
const CONFIG_FILE = path.join(DATA_DIR, 'sunat_config.json');

async function main() {
  console.log('====================================================');
  console.log('🏛️  SINCRONIZACIÓN OFICIAL DEL PADRÓN RUC DE SUNAT');
  console.log('====================================================');
  console.log('Descargando padrón oficial directo de servidores SUNAT (sin intermediarios)...');
  console.log('URL:', SUNAT_ZIP_URL);

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const startTime = Date.now();

  try {
    const res = await fetch(SUNAT_ZIP_URL);
    if (!res.ok) {
      throw new Error(`Error en servidor SUNAT: ${res.status} ${res.statusText}`);
    }

    const totalBytes = Number(res.headers.get('content-length') || 0);
    console.log(`Tamaño del archivo oficial: ${(totalBytes / (1024 * 1024)).toFixed(1)} MB`);

    const fileStream = fs.createWriteStream(ZIP_PATH);
    await pipeline(res.body, fileStream);

    console.log(`✅ Descarga completada en ${((Date.now() - startTime) / 1000).toFixed(1)}s.`);
    console.log('Descomprimiendo archivo del Padrón...');

    // Descomprimir usando comando del sistema
    const isWin = process.platform === 'win32';
    const unzipCmd = isWin ? 'tar' : 'unzip';
    const args = isWin ? ['-xf', ZIP_PATH, '-C', DATA_DIR] : ['-o', ZIP_PATH, '-d', DATA_DIR];

    const child = spawn(unzipCmd, args, { stdio: 'inherit' });
    child.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Archivo descomprimido con éxito.');
        try {
          // Actualizar metadata de sincronización
          let cfg = {};
          if (fs.existsSync(CONFIG_FILE)) {
            cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
          }
          cfg.lastSync = new Date().toISOString();
          fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
        } catch {}
        console.log('¡Padrón Oficial de SUNAT listo para consultas instantáneas en local!');
      } else {
        console.error('Error al descomprimir con código:', code);
      }
    });

  } catch (err) {
    console.error('❌ Error durante la sincronización:', err.message);
  }
}

main();

