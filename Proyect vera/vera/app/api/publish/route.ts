import { NextResponse } from 'next/server';
import { publishDemos, isDeployConfigured } from '@/lib/deploy';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// GET /api/publish — ¿está configurado el hosting?
export async function GET() {
  return NextResponse.json({ configured: isDeployConfigured(), base: process.env.DEMOS_PUBLIC_BASE || null });
}

// POST /api/publish — publica todos los demos en GitHub Pages. { leadId? } para verificar que ese demo quede en vivo.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const leadId = body.leadId != null ? Number(body.leadId) : undefined;
  const result = await publishDemos(leadId);
  return NextResponse.json(result, { status: result.ok ? 200 : result.configured ? 502 : 400 });
}
