// Public Maps search responses. Stop on consent, CAPTCHA or rate limiting;
// no cookie fabrication, proxy rotation, browser impersonation or retry loop.
export class ProspectError extends Error {
  constructor(message, status = 502) { super(message); this.status = status; }
}
const fields = '!10b1!12m6!1m1!18b1!2m1!20e3!6m1!114b1!17m1!3e1!20m57!2m2!1i203!2i100!3m2!2i4!5b1!6m6!1m2!1i86!2i86!1m2!1i408!2i240!7m33!1m3!1e1!2b0!3e3!1m3!1e2!2b1!3e2!1m3!1e2!2b0!3e3!1m3!1e8!2b0!3e3!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e10!2b0!3e4!1m3!1e9!2b1!3e2!2b1!9b0!15m8!1m7!1m2!1m1!1e2!2m2!1i195!2i195!3i20';
const get = (array, ...path) => path.reduce((node, index) => Array.isArray(node) ? node[index] : undefined, array);
export function normalizeWebsite(value) {
  if (typeof value !== 'string') return '';
  try {
    let url = new URL(value, 'https://www.google.com');
    if (url.hostname === 'www.google.com' && url.pathname === '/url') url = new URL(url.searchParams.get('q') || url.searchParams.get('url') || '');
    return ['https:', 'http:'].includes(url.protocol) && !/(^|\.)(google\.[a-z.]+|gstatic\.com)$/.test(url.hostname) ? url.href : '';
  } catch { return ''; }
}
export function parseMaps(text) {
  let data;
  try {
    data = JSON.parse(text.replace(/^\)\]\}'\s*/, ''));
    if (typeof data?.d === 'string') data = JSON.parse(data.d.replace(/^\)\]\}'\s*/, ''));
  } catch { throw new ProspectError('Google devolvió una página de bloqueo o un formato que no se puede leer. Prueba más tarde; no se han importado datos.'); }
  const found = new Map();
  function walk(node, depth = 0) {
    if (!Array.isArray(node) || depth > 35) return;
    if (typeof node[10] === 'string' && /^0x[\da-f]+:0x[\da-f]+$/i.test(node[10]) && typeof node[11] === 'string') {
      const mapsId = node[10];
      const cid = BigInt(mapsId.split(':')[1]).toString();
      const phones = get(node, 178, 0, 1);
      const intl = Array.isArray(phones) ? phones.find(p => Array.isArray(p) && p[1] === 2)?.[0] : '';
      const categories = Array.isArray(node[13]) ? node[13].filter(c => typeof c === 'string') : [];
      const lat = typeof get(node, 9, 2) === 'number' ? get(node, 9, 2) : null;
      const lng = typeof get(node, 9, 3) === 'number' ? get(node, 9, 3) : null;
      found.set(mapsId, {
        mapsId, placeId: typeof node[78] === 'string' ? node[78] : '',
        name: node[11].trim(), sector: categories[0] || '', categories,
        address: typeof node[39] === 'string' ? node[39] : (Array.isArray(node[2]) ? node[2].filter(c => typeof c === 'string').join(', ') : ''),
        phone: typeof intl === 'string' && intl ? intl : (get(node, 178, 0, 0) || ''),
        web: normalizeWebsite(get(node, 7, 0)), email: '',
        rating: typeof get(node, 4, 7) === 'number' ? get(node, 4, 7) : null,
        reviewCount: typeof get(node, 4, 8) === 'number' ? get(node, 4, 8) : null,
        latitude: lat,
        longitude: lng,
        source: 'https://www.google.com/maps?cid=' + cid,
      });
      return;
    }
    for (const item of node) walk(item, depth + 1);
  }
  walk(data);
  return [...found.values()];
}
export function searchInput(body) {
  if (!body || typeof body !== 'object') throw new ProspectError('Indica un rubro y una ubicación.', 400);
  const input = {};
  for (const key of ['sector', 'country', 'region', 'province', 'city', 'district', 'locality']) {
    input[key] = typeof body[key] === 'string' ? body[key].trim().slice(0, 120) : '';
  }
  if (!input.sector || !input.country) throw new ProspectError('Rubro y país son obligatorios.', 400);
  if (![input.region, input.province, input.city, input.district, input.locality].some(Boolean)) throw new ProspectError('Añade al menos una región, provincia, ciudad, distrito o localidad para delimitar la búsqueda.', 400);
  const offset = Number(body.offset || 0);
  if (!Number.isInteger(offset) || offset < 0 || offset > 100 || offset % 20 !== 0) throw new ProspectError('Página de búsqueda inválida.', 400);
  return {...input, offset};
}
async function readLimited(response, maxBytes = 3_000_000) {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const chunks = []; let size = 0;
  try {
    for (;;) { const {done, value} = await reader.read(); if (done) break; size += value.length; if (size > maxBytes) { await reader.cancel(); throw new ProspectError('La página supera el límite de lectura.'); } chunks.push(value); }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return new TextDecoder().decode(bytes);
}
function extractPeruvianPhone(text) {
  if (!text) return '';
  const mob = text.match(/(?:(?:\+?51\s*)?)(9\d{2}[\s.-]?\d{3}[\s.-]?\d{3})\b/);
  if (mob) return mob[1].replace(/[\s.-]/g, '');
  const land = text.match(/(?:(?:\+?51\s*)?)(0\d{1,2}[\s.-]?\d{6,7})\b/);
  if (land) return land[1].replace(/[\s.-]/g, '');
  return '';
}

function unwrapRedirectUrl(link) {
  if (!link) return '';
  try {
    const u = new URL(link);
    if (u.hostname.includes('google.com')) {
      const q = u.searchParams.get('url') || u.searchParams.get('q');
      if (q && q.startsWith('http')) return q;
    }
    return link;
  } catch {
    return link;
  }
}

function cleanOrganicTitle(title) {
  return (title || '')
    .replace(/\s*[-|–—:]\s*(InfoEmpresa|Páginas Amarillas|Paginas Amarillas|Facebook|LinkedIn|CompuTrabajo|Bumeran|Guru|Guía|Guia|Postula|Trabajo|Portal).*$/i, '')
    .replace(/\s*(?:en|,)\s*(?:Bagua Grande|Bagua Chica|Bagua|Amazonas|Aramango|Piura|Huancabamba|Huarmaca|Lima|Perú|Peru).*$/i, '')
    .trim();
}

export async function searchBrightData(input, query, apiKey = process.env.BRIGHTDATA_API_KEY || '4b8bcc63-1cec-43bd-9588-03c834451507', zone = process.env.BRIGHTDATA_ZONE || 'serp_api1') {
  const gUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=es&gl=pe`;
  const res = await fetch('https://api.brightdata.com/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
    body: JSON.stringify({
      zone,
      url: gUrl,
      format: 'raw',
      data_format: 'parsed_json'
    }),
    signal: AbortSignal.timeout(45000)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new ProspectError(`Bright Data respondió con error ${res.status}: ${errText.slice(0, 150)}`, 502);
  }

  const text = await res.text();
  if (!text || !text.trim()) {
    return { query, extractedAt: new Date().toISOString(), results: [], nextOffset: null };
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    console.warn('Bright Data returned non-JSON response:', text.slice(0, 120));
    return { query, extractedAt: new Date().toISOString(), results: [], nextOffset: null };
  }

  const extractedAt = new Date().toISOString();
  const results = [];
  const seenNames = new Set();

  // 1. Google Maps local pack (snack_pack: negocios locales con ficha completa en Maps)
  if (Array.isArray(data.snack_pack)) {
    for (const item of data.snack_pack) {
      const name = (item.name || '').trim();
      if (!name || seenNames.has(name.toLowerCase())) continue;
      seenNames.add(name.toLowerCase());

      const matchMapsId = (item.maps_link || '').match(/0x[\da-f]+:0x[\da-f]+/i);
      const mapsId = matchMapsId ? matchMapsId[0] : (item.cid ? `0x0:${BigInt(item.cid).toString(16)}` : `bd:${name}`);
      const cid = item.cid || (matchMapsId ? BigInt(matchMapsId[0].split(':')[1]).toString() : '');

      let addr = (item.address || '')
        .replace(/^Más de \d+ años de actividad\s*[⋅·•-]\s*/i, '')
        .replace(/^En servicio hace \d+ años\s*[⋅·•-]\s*/i, '')
        .trim();

      if (!addr && item.maps_link && item.maps_link.includes('/dir//')) {
        const parts = decodeURIComponent(item.maps_link).split('/dir//')[1]?.split('/data=')[0];
        if (parts) {
          const splitComma = parts.split(',');
          if (splitComma.length > 1) {
            addr = splitComma.slice(1).join(',').trim();
          }
        }
      }

      results.push({
        mapsId,
        placeId: '',
        name,
        sector: item.type || input.sector || '',
        categories: item.type ? [item.type] : [],
        address: addr || `${input.district || input.locality || input.province || ''}, ${input.region || ''}`,
        phone: item.phone || '',
        web: '',
        rating: typeof item.rating === 'number' ? item.rating : null,
        reviewCount: typeof item.reviews_cnt === 'number' ? item.reviews_cnt : null,
        latitude: null,
        longitude: null,
        source: item.maps_link || (cid ? `https://www.google.com/maps?cid=${cid}` : `https://www.google.com/maps/search/${encodeURIComponent(name)}`),
        extractedAt,
        searchTerritory: input,
        locationOrigin: 'brightdata_serp',
        emailStatus: 'Sin web'
      });
    }
  }

  // 2. Resultados orgánicos (para zonas rurales, centros poblados o complementar empresas)
  if (Array.isArray(data.organic) && results.length < 20) {
    for (const org of data.organic) {
      // Entidades explícitas en snippet (ej. 'Empresa Sol de Amazonas S.R.L. · 941 915 511')
      const snippetMatches = (org.description || '').matchAll(/(?:PER[ÚU]|[\.\•\·\-])\s*([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚáéíóúñ\s&.]{3,45}?(?:S\.?R\.?L\.?|S\.?A\.?C\.?|E\.?I\.?R\.?L\.?|S\.?A\.?))\s*[·•-]\s*(9\d{2}[\s.-]?\d{3}[\s.-]?\d{3})/gi);
      for (const m of snippetMatches) {
        const sName = m[1].replace(/^PER[ÚU]\.\s*/i, '').trim();
        const sPhone = m[2].replace(/[\s.-]/g, '');
        if (sName.length > 4 && !seenNames.has(sName.toLowerCase())) {
          seenNames.add(sName.toLowerCase());
          results.push({
            mapsId: `snip:${Buffer.from(sName).toString('base64').slice(0, 20)}`,
            placeId: '',
            name: sName,
            sector: input.sector || '',
            categories: [input.sector],
            address: `${input.district || input.locality || input.province || ''}, ${input.region || ''}`,
            phone: sPhone,
            web: '',
            rating: null,
            reviewCount: null,
            latitude: null,
            longitude: null,
            source: `https://www.google.com/maps/search/${encodeURIComponent(sName + ' ' + (input.province || ''))}`,
            extractedAt,
            searchTerritory: input,
            locationOrigin: 'brightdata_snippet',
            emailStatus: 'Sin web'
          });
        }
      }

      // Título de empresa orgánico
      const cleanName = cleanOrganicTitle(org.title);
      const isBlacklisted = /ofertas de trabajo|lo mejor de|otras actividades|postula y|bolsa de trabajo|los mejores|directorio|empleos de|otros tipos|vacantes/i.test(cleanName);
      const isCategoryWord = /^(?:Transporte(?:s)?|Transporte de carga|Transporte de pasajeros|Transporte de carga por carretera|Mudanzas|Empresa transporte|Servicio de transporte|Ferretería|Restaurante|Clínica dental|Hoteles|Farmacias)$/i.test(cleanName);
      if (cleanName.length > 5 && !isBlacklisted && !isCategoryWord && !seenNames.has(cleanName.toLowerCase())) {
        seenNames.add(cleanName.toLowerCase());
        const phone = extractPeruvianPhone(org.description);
        const unwrapped = unwrapRedirectUrl(org.link);
        const isExternalWeb = unwrapped && !unwrapped.includes('google.com') && !unwrapped.includes('facebook.com') && !unwrapped.includes('paginasamarillas.com.pe') && !unwrapped.includes('universidadperu.com');

        results.push({
          mapsId: `org:${Buffer.from(cleanName).toString('base64').slice(0, 20)}`,
          placeId: '',
          name: cleanName,
          sector: input.sector || '',
          categories: [input.sector],
          address: `${input.district || input.locality || input.province || ''}, ${input.region || ''}`,
          phone,
          web: isExternalWeb ? unwrapped : '',
          rating: null,
          reviewCount: null,
          latitude: null,
          longitude: null,
          source: unwrapped || `https://www.google.com/maps/search/${encodeURIComponent(cleanName + ' ' + (input.province || ''))}`,
          extractedAt,
          searchTerritory: input,
          locationOrigin: 'brightdata_organic',
          emailStatus: isExternalWeb ? 'Pendiente' : 'Sin web'
        });
      }
    }
  }

  return {
    query,
    extractedAt,
    results: results.slice(0, 20),
    nextOffset: null
  };
}

export async function searchMaps(body, request = fetch) {
  const input = searchInput(body);
  const query = [...new Set([input.sector, input.locality, input.district, input.city, input.province, input.region, input.country].filter(Boolean))].join(' ');

  // 1. Usar Bright Data SERP API como motor principal desbloqueado
  const brightKey = process.env.BRIGHTDATA_API_KEY || '4b8bcc63-1cec-43bd-9588-03c834451507';
  if (brightKey) {
    try {
      const bdRes = await searchBrightData(input, query, brightKey);
      // Retornar siempre el resultado obtenido por Bright Data (incluso si son 0 empresas para esa zona rural),
      // evitando caer en la consulta directa a Google que gatilla bloqueos 429/sorry.
      return bdRes;
    } catch (e) {
      console.warn('Bright Data error:', e.message);
    }
  }

  // 2. Fallback a consulta directa (solo si Bright Data no está configurado)
  const gl = ({'Perú':'pe','México':'mx','Colombia':'co','Chile':'cl','Argentina':'ar','Ecuador':'ec','Bolivia':'bo','España':'es','Estados Unidos':'us'})[input.country];
  const url = new URL('https://www.google.com/search');
  url.search = new URLSearchParams({tbm:'map', hl:'es', ...(gl ? {gl} : {}), q:query, pb:`!1s${query}!7i20!8i${input.offset}${fields}`}).toString();
  const response = await request(url, {headers:{'Accept-Language':'es'}, signal:AbortSignal.timeout(20000), redirect:'manual'});
  const location = response.headers.get('location') || '';
  if (response.status === 429 || response.status === 403 || location.includes('/sorry/') || location.includes('google.com/sorry')) {
    throw new ProspectError('Google ha activado una verificación temporal (límite 429/CAPTCHA). El barrido se ha detenido automáticamente para proteger tu conexión. Espera unos minutos antes de reanudar.', 429);
  }
  if (!response.ok) throw new ProspectError('Google no permitió completar la búsqueda. Detén el barrido y prueba más tarde.', 502);
  const results = parseMaps(await readLimited(response));
  const extractedAt = new Date().toISOString();
  return {query, extractedAt, results:results.slice(0,20).map(r => ({...r, extractedAt, searchTerritory:input, locationOrigin:'search', emailStatus:r.web?'Pendiente':'Sin web'})), nextOffset:results.length >= 20 && input.offset < 100 ? input.offset + 20 : null};
}

export function publicWebsite(value) {
  let url; try { url = new URL(value); } catch { throw new ProspectError('URL de empresa inválida.', 400); }
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || (url.port && !['80','443'].includes(url.port)) || !/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(host) || /^[\d.]+$/.test(host) || /(^|\.)(localhost|local|internal|test|invalid|example|onion)$/.test(host)) throw new ProspectError('Solo se pueden consultar webs públicas de empresas.', 400);
  return url;
}
export function isPublicIP(ip) {
  if (ip.includes(':')) return /^(2|3)[\da-f]{3}:/i.test(ip) && !/^2001:(db8|0:|10:|20:)/i.test(ip) && !/^2002:/i.test(ip);
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  return !(p[0] === 0 || p[0] === 10 || p[0] === 127 || p[0] >= 224 || (p[0] === 169 && p[1] === 254) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && (p[1] === 168 || p[1] === 0 || p[1] === 2)) || (p[0] === 100 && p[1] >= 64 && p[1] <= 127) || (p[0] === 198 && (p[1] === 18 || p[1] === 19 || p[1] === 51)) || (p[0] === 203 && p[1] === 0));
}
async function verifyDNS(host, request) {
  const addresses = [];
  for (const type of ['A','AAAA']) {
    const response = await request(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${type}`,{headers:{accept:'application/dns-json'},signal:AbortSignal.timeout(6000)});
    if (!response.ok) throw new ProspectError('No se pudo validar el dominio de la empresa.');
    const json = await response.json();
    for (const a of json.Answer || []) if (a.type === 1 || a.type === 28) addresses.push(a.data);
  }
  if (!addresses.length || addresses.some(a => !isPublicIP(a))) throw new ProspectError('El dominio no resuelve a una web pública.');
}
async function fetchWebsite(value, request) {
  let url = publicWebsite(value);
  for (let i = 0; i < 4; i++) {
    await verifyDNS(url.hostname, request);
    const response = await request(url, {headers:{'User-Agent':'OdiseaCloudContactReader/1.0 (+https://odiseacloud.com)'},redirect:'manual',signal:AbortSignal.timeout(10000)});
    if ([301,302,303,307,308].includes(response.status)) { await response.body?.cancel(); url = publicWebsite(new URL(response.headers.get('location') || '', url).href); continue; }
    if (!response.ok) throw new ProspectError(response.status === 403 || response.status === 429 ? 'La web limita el acceso automatizado.' : 'La web no está disponible.');
    if (!/text\/html|application\/xhtml/i.test(response.headers.get('content-type') || '')) { await response.body?.cancel(); throw new ProspectError('La URL no devuelve una página web.'); }
    return {html:await readLimited(response, 1_500_000), url};
  }
  throw new ProspectError('La web tiene demasiadas redirecciones.');
}
export function extractEmails(html) {
  const decoded = html.replace(/&#64;|&#x40;|&commat;/gi,'@').replace(/&#46;|&#x2e;/gi,'.');
  const visible = decoded.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,' ');
  const candidates = [...visible.matchAll(/[a-z0-9][a-z0-9._%+\-]*@[a-z0-9](?:[a-z0-9.\-]*[a-z0-9])?\.[a-z]{2,24}/gi)].map(m=>m[0].toLowerCase());
  return [...new Set(candidates)].filter(e=>!/(noreply|no-reply|sentry|example\.|wixpress|schema\.org|yourdomain|domain\.com|test\.com|\.png$|\.jpg$|\.webp$)/i.test(e)).slice(0,10);
}
export async function findWebsiteEmails(value, request = fetch) {
  const first = await fetchWebsite(value, request);
  const sources = []; const emails = new Set();
  const collect = (page) => { const found = extractEmails(page.html); found.forEach(e=>emails.add(e)); if(found.length) sources.push(page.url.href); };
  collect(first);
  if (!emails.size) {
    const links = [...first.html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi)].map(m=>m[1]);
    let contact;
    for (const link of links) { try { const url = new URL(link.replaceAll('&amp;','&'), first.url); if(url.origin===first.url.origin && /contact|contacto|contactenos|contactanos|nosotros/i.test(url.pathname) && url.href!==first.url.href) { contact=url.href; break; } } catch {} }
    if(contact) { try { collect(await fetchWebsite(contact, request)); } catch {} }
  }
  const list = [...emails];
  const ownDomain = first.url.hostname.replace(/^www\./,'');
  list.sort((a,b)=>Number(b.endsWith('@'+ownDomain))-Number(a.endsWith('@'+ownDomain)));
  return {email:list[0]||'', emails:list, emailSources:sources, emailStatus:list.length?'Publicado en web':'No publicado', emailCheckedAt:new Date().toISOString()};
}
