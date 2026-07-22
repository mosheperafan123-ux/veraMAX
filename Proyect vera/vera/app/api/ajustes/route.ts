import { NextResponse } from 'next/server';
import { getAjustes, setAjustes, type Ajustes } from '@/lib/antiban';

export const dynamic = 'force-dynamic';

// GET /api/ajustes — ajustes anti-baneo efectivos (config o defaults de .env).
export async function GET() {
  return NextResponse.json(getAjustes());
}

// POST /api/ajustes — guarda los ajustes editados en el dashboard.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const patch: Partial<Ajustes> = {};

  const clampInt = (v: unknown, min: number, max: number): number | undefined => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : undefined;
  };

  const hi = clampInt(body.horaInicio, 0, 23);
  const hf = clampInt(body.horaFin, 1, 24);
  if (hi != null) patch.horaInicio = hi;
  if (hf != null) patch.horaFin = hf;
  if (Array.isArray(body.dias)) {
    patch.dias = body.dias.map((d: unknown) => Math.round(Number(d))).filter((d: number) => d >= 0 && d <= 6);
  }
  const lim = clampInt(body.limiteDiario, 1, 200);
  if (lim != null) patch.limiteDiario = lim;

  // El fin debe ser mayor que el inicio; si no, no tocamos las horas.
  if (patch.horaInicio != null && patch.horaFin != null && patch.horaFin <= patch.horaInicio) {
    delete patch.horaInicio;
    delete patch.horaFin;
  }

  setAjustes(patch);
  return NextResponse.json(getAjustes());
}
