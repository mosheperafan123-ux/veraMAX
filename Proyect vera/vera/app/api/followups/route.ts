import { NextResponse } from 'next/server';
import { seguimientosPendientes, enviarSeguimiento, runSeguimientos } from '@/lib/followups';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// GET /api/followups — leads que hoy tocan seguimiento (con el texto listo a enviar).
export async function GET() {
  return NextResponse.json({ pendientes: seguimientosPendientes() });
}

/**
 * POST /api/followups — envía seguimientos por plantilla.
 *   { leadId }  → envía solo ese lead.
 *   (sin body)  → envía TODOS los que tocan hoy (útil para tarea programada).
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (body?.leadId) {
    const r = await enviarSeguimiento(Number(body.leadId));
    return NextResponse.json(r, { status: r.ok ? 200 : 400 });
  }
  const r = await runSeguimientos();
  return NextResponse.json({ ok: true, ...r });
}
