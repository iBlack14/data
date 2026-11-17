import { NextRequest, NextResponse } from 'next/server';

const BRIGHT_KEY = process.env.BRIGHTDATA_API_KEY || '4b8bcc63-1cec-43bd-9588-03c834451507';
const BRIGHT_ZONE = process.env.BRIGHTDATA_ZONE || 'serp_api1';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (!q) return NextResponse.json({ error: 'Parámetro q requerido' }, { status: 400 });

  const digits = q.replace(/\D/g, '');
  const isRuc = digits.length === 11;

  try {
    const searchQuery = isRuc ? digits : `${q} RUC SUNAT`;
    const gUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&gl=pe&hl=es`;

    const res = await fetch('https://api.brightdata.com/request', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BRIGHT_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        zone: BRIGHT_ZONE,
        url: gUrl,
        format: 'raw',
        data_format: 'parsed_json',
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Bright Data error ${res.status}: ${errText.slice(0, 100)}` }, { status: 502 });
    }

    const json = await res.json() as any;
    const organic: any[] = Array.isArray(json?.organic) ? json.organic : [];

    if (organic.length === 0) {
      return NextResponse.json({ error: 'No se encontraron resultados en SUNAT' }, { status: 404 });
    }

    if (isRuc) {
      const match = parseRucFromResults(organic, digits);
      if (match) {
        return NextResponse.json(match);
      }
      return NextResponse.json({ error: `No se encontraron datos para el RUC ${digits}` }, { status: 404 });
    } else {
      const list = parseCandidatesFromResults(organic);
      if (list.length === 0) {
        return NextResponse.json({ error: 'No se encontraron empresas con ese nombre' }, { status: 404 });
      }
      return NextResponse.json({ results: list.slice(0, 8) });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error consultando SUNAT' }, { status: 500 });
  }
}

function cleanCompanyName(title: string): string {
  return (title || '')
    .replace(/\s*-\s*(Facturalo\.pe|Trámites Perú|Trámites|UniversidadPeru|Scribd|TodoLicitaciones|Consulta RUC|SUNAT|ArchivoBiz|Guía Legal|InfoEmpresa|Páginas Amarillas).*$/i, '')
    .replace(/\s*\|\s*.*$/, '')
    .replace(/^RUC\s*:\s*\d{11}\s*[-–]\s*/i, '')
    .trim();
}

function parseRucFromResults(results: any[], ruc: string) {
  let bestNombre = '';
  let bestEstado = 'ACTIVO';
  let bestCondicion = 'HABIDO';
  let bestDireccion = '';

  for (const item of results) {
    const title = item.title || '';
    const desc = item.description || '';
    const text = `${title} ${desc}`;

    // Razón social
    if (!bestNombre) {
      const rsMatch = desc.match(/Raz[oó]n\s+Social:\s*([^;.]+)/i);
      if (rsMatch && rsMatch[1].trim().length > 3) {
        bestNombre = rsMatch[1].trim();
      } else {
        const cleaned = cleanCompanyName(title);
        if (cleaned && cleaned.length > 3 && !cleaned.toLowerCase().includes('consulta ruc') && !cleaned.toLowerCase().includes('superintendencia')) {
          bestNombre = cleaned;
        }
      }
    }

    // Estado
    const estMatch = desc.match(/estado\s+([A-ZÁÉÍÓÚÑ]+)/i);
    if (estMatch && ['ACTIVO', 'BAJA', 'SUSPENDIDO', 'INACTIVO'].includes(estMatch[1].toUpperCase())) {
      bestEstado = estMatch[1].toUpperCase();
    }

    // Condicion
    const condMatch = desc.match(/condici[oó]n\s+([A-ZÁÉÍÓÚÑ]+)/i);
    if (condMatch && ['HABIDO', 'NO HABIDO', 'NO HALLADO', 'PENDIENTE'].includes(condMatch[1].toUpperCase())) {
      bestCondicion = condMatch[1].toUpperCase();
    }

    // Domicilio fiscal
    if (!bestDireccion) {
      const dirMatch = desc.match(/(?:domicilio fiscal est[aá] en|direcci[oó]n:?|ubicad[oa] en)\s+([^.]+)/i);
      if (dirMatch && dirMatch[1].trim().length > 5) {
        bestDireccion = dirMatch[1].trim();
      }
    }
  }

  if (!bestNombre) return null;

  return {
    ruc,
    nombre: bestNombre,
    estado: bestEstado,
    condicion: bestCondicion,
    direccion: bestDireccion,
  };
}

function parseCandidatesFromResults(results: any[]) {
  const seen = new Set<string>();
  const list: any[] = [];

  for (const item of results) {
    const text = `${item.title || ''} ${item.description || ''}`;
    const rucMatch = text.match(/\b(10|15|16|17|20)\d{9}\b/);
    if (!rucMatch) continue;

    const ruc = rucMatch[0];
    if (seen.has(ruc)) continue;
    seen.add(ruc);

    let nombre = '';
    const rsMatch = (item.description || '').match(/Raz[oó]n\s+Social:\s*([^;.]+)/i);
    if (rsMatch) {
      nombre = rsMatch[1].trim();
    } else {
      nombre = cleanCompanyName(item.title || '');
    }

    if (!nombre || nombre.toLowerCase().includes('consulta ruc')) continue;

    const estMatch = (item.description || '').match(/estado\s+([A-ZÁÉÍÓÚÑ]+)/i);
    const estado = estMatch ? estMatch[1].toUpperCase() : 'ACTIVO';

    list.push({
      ruc,
      nombre,
      estado,
      condicion: 'HABIDO',
      direccion: '',
    });
  }

  return list;
}
