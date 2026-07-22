import { NextResponse } from 'next/server';
import fs from 'node:fs';
import { crearRespaldo, listarRespaldos, rutaRespaldo } from '@/lib/backup';

export const dynamic = 'force-dynamic';

/**
 * GET /api/backup            → lista de respaldos.
 * GET /api/backup?descargar=<nombre> → descarga ese respaldo (.db).
 */
export async function GET(req: Request) {
  const descargar = new URL(req.url).searchParams.get('descargar');
  if (descargar) {
    const p = rutaRespaldo(descargar);
    if (!p) return NextResponse.json({ error: 'Respaldo no encontrado' }, { status: 404 });
    const buf = fs.readFileSync(p);
    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${descargar}"`,
        'Content-Length': String(buf.length),
      },
    });
  }
  return NextResponse.json({ respaldos: listarRespaldos() });
}

// POST /api/backup — crea un respaldo nuevo ahora.
export async function POST() {
  try {
    return NextResponse.json(crearRespaldo());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
