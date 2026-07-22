import { NextResponse } from 'next/server';
import { leadsExpirados } from '@/lib/db';
import { cleanupDemos } from '@/lib/cleanup';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const DEFAULT_DAYS = Number(process.env.DEMO_EXPIRE_DAYS || 3);

// GET /api/cleanup?dias=3 — vista previa: cuántas páginas se eliminarían (no borra nada).
export async function GET(req: Request) {
  const dias = Number(new URL(req.url).searchParams.get('dias')) || DEFAULT_DAYS;
  const candidatos = leadsExpirados(dias).map((l) => ({ id: l.id, nombre: l.nombre, ultimo_contacto: l.ultimo_contacto }));
  return NextResponse.json({ dias, total: candidatos.length, candidatos });
}

// POST /api/cleanup — ejecuta la limpieza y republica. { dias?, publicar? }
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const dias = body.dias != null ? Number(body.dias) : undefined;
  const publicar = body.publicar !== false;
  const result = await cleanupDemos(dias, { publicar });
  return NextResponse.json(result);
}
