import { NextRequest, NextResponse } from 'next/server';

// apis.net.pe — gratuito, sin límite de llamadas, sin API key
const BASE = 'https://api.apis.net.pe/v2/sunat';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (!q) return NextResponse.json({ error: 'Parámetro q requerido' }, { status: 400 });

  const digits = q.replace(/\D/g, '');
  const isRuc   = digits.length === 11;
  const isDni   = digits.length === 8;

  try {
    if (isRuc) {
      const res = await fetch(`${BASE}/ruc?numero=${digits}`, {
        headers: { Accept: 'application/json', Referer: 'https://odiseacloud.com' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return NextResponse.json({ error: `SUNAT respondió ${res.status}` }, { status: 502 });
      const data = await res.json() as any;
      return NextResponse.json(normalize(data));
    }

    if (isDni) {
      const res = await fetch(`${BASE}/dni?numero=${digits}`, {
        headers: { Accept: 'application/json', Referer: 'https://odiseacloud.com' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return NextResponse.json({ error: `SUNAT respondió ${res.status}` }, { status: 502 });
      const data = await res.json() as any;
      return NextResponse.json({ nombre: `${data.nombres ?? ''} ${data.apellidoPaterno ?? ''} ${data.apellidoMaterno ?? ''}`.trim() });
    }

    // Búsqueda por razón social
    const res = await fetch(`${BASE}/ruc?razonSocial=${encodeURIComponent(q)}&estado=ACTIVO`, {
      headers: { Accept: 'application/json', Referer: 'https://odiseacloud.com' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return NextResponse.json({ error: `SUNAT respondió ${res.status}` }, { status: 502 });
    const data = await res.json() as any;
    const list: any[] = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [data]);
    return NextResponse.json({ results: list.slice(0, 10).map(normalize) });

  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error desconocido' }, { status: 500 });
  }
}

function normalize(d: any) {
  const ubigeo: string[] = Array.isArray(d.ubigeo) ? d.ubigeo : [];
  return {
    ruc:           d.ruc ?? d.numero ?? '',
    nombre:        d.razonSocial ?? d.nombre ?? '',
    estado:        d.estado ?? '',
    condicion:     d.condicion ?? '',
    direccion:     [d.direccion, ubigeo[2], ubigeo[1], ubigeo[0]].filter(Boolean).join(', '),
    departamento:  ubigeo[0] ?? '',
    provincia:     ubigeo[1] ?? '',
    distrito:      ubigeo[2] ?? '',
    tipo:          d.tipo ?? '',
    actividadPrincipal: Array.isArray(d.actividadEconomicaPrincipal)
      ? (d.actividadEconomicaPrincipal[0]?.actividad ?? '')
      : '',
  };
}
