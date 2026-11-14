import { NextRequest, NextResponse } from 'next/server';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const BASE_URL = 'https://www.universidadperu.com';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (!q) return NextResponse.json({ error: 'Parámetro q requerido' }, { status: 400 });

  try {
    const form = new URLSearchParams({ buscaempresa: q });
    const res = await fetch(`${BASE_URL}/empresas/busqueda/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-PE,es;q=0.9,en;q=0.8',
        'Origin': BASE_URL,
        'Referer': `${BASE_URL}/empresas/busqueda/`,
      },
      body: form.toString(),
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Error HTTP ${res.status}` }, { status: 502 });
    }

    const html = await res.text();
    const finalUrl = res.url;

    // Si redireccionó a la página de una empresa concreta
    if (finalUrl.includes('/empresa-') && finalUrl.includes('-peru.php')) {
      const data = parseSinglePage(html);
      if (data) return NextResponse.json(data);
      return NextResponse.json({ error: 'No se pudo extraer datos de la empresa' }, { status: 404 });
    }

    // Página con lista de resultados
    const results = parseListPage(html);
    if (results.length === 0) {
      return NextResponse.json({ error: 'No se encontraron resultados en SUNAT' }, { status: 404 });
    }
    if (results.length === 1) {
      return NextResponse.json(results[0]);
    }
    return NextResponse.json({ results: results.slice(0, 10) });

  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error consultando SUNAT' }, { status: 500 });
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Extrae texto entre dos marcas, eliminando tags HTML internos */
function between(html: string, open: string, close: string): string {
  const idx = html.indexOf(open);
  if (idx === -1) return '';
  const from = idx + open.length;
  const to = html.indexOf(close, from);
  if (to === -1) return '';
  return html.slice(from, to).replace(/<[^>]*>/g, '').trim();
}

/** Busca el valor de celda de tabla adyacente a una etiqueta */
function tableValue(html: string, label: RegExp): string {
  const m = html.match(label);
  if (!m) return '';
  const afterLabel = html.slice(html.indexOf(m[0]) + m[0].length);
  // Siguiente <td...>...</td>
  const cell = afterLabel.match(/<td[^>]*>([\s\S]*?)<\/td>/i);
  return cell ? cell[1].replace(/<[^>]*>/g, '').trim() : '';
}

/** Parsea la página de detalle de UNA empresa */
function parseSinglePage(html: string): any | null {
  // RUC: secuencia de 11 dígitos que aparece en el HTML
  const rucMatch = html.match(/\b(10|15|16|17|20)\d{9}\b/);
  const ruc = rucMatch?.[0] ?? '';

  // Razón social: título h1 o h2, o celda de tabla
  const nombre =
    between(html, '<h1', '</h1>') ||
    between(html, '<h2', '</h2>') ||
    tableValue(html, /Raz[oó]n\s+Social/i) ||
    tableValue(html, /Nombre\s+o\s+Raz[oó]n/i);

  const estado     = tableValue(html, /Estado\s+del\s+Contribuyente/i) || tableValue(html, /Estado:/i);
  const condicion  = tableValue(html, /Condici[oó]n\s+del\s+Contribuyente/i) || tableValue(html, /Condici[oó]n:/i);
  const direccion  = tableValue(html, /Domicilio\s+Fiscal/i) || tableValue(html, /Direcci[oó]n:/i);

  if (!ruc && !nombre) return null;
  return { ruc, nombre, estado, condicion, direccion };
}

/** Parsea la página de lista de resultados (múltiples empresas) */
function parseListPage(html: string): any[] {
  const results: any[] = [];
  const seen = new Set<string>();

  // Patrón 1: enlaces a páginas de empresa con nombre visible
  const linkRe = /href="([^"]*\/empresa-[^"]+\.php)"[^>]*>\s*([^<]{4,})/gi;
  for (const m of html.matchAll(linkRe)) {
    const name = m[2].trim();
    if (!name || seen.has(name)) continue;
    // Buscar RUC cercano al enlace
    const pos = html.indexOf(m[0]);
    const ctx = html.slice(Math.max(0, pos - 300), pos + 300);
    const rucNear = ctx.match(/\b(10|15|16|17|20)\d{9}\b/)?.[0] ?? '';
    seen.add(name);
    results.push({ ruc: rucNear, nombre: name, estado: '', condicion: '', direccion: '' });
  }

  // Patrón 2: filas de tabla con RUC + nombre (si no encontramos enlaces)
  if (results.length === 0) {
    const rowRe = /\b((10|15|16|17|20)\d{9})\b[^<]{0,60}([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑA-Za-z\s&.,'-]{5,80})/g;
    for (const m of html.matchAll(rowRe)) {
      const ruc = m[1], nombre = m[3]?.trim();
      if (!ruc || !nombre || seen.has(ruc)) continue;
      seen.add(ruc);
      results.push({ ruc, nombre, estado: '', condicion: '', direccion: '' });
    }
  }

  return results;
}
