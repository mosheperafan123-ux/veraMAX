import { NextResponse } from 'next/server';
import { getLead, updateLead, listMensajes, type Lead } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/leads/:id — detalle + mensajes
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const lead = getLead(Number(params.id));
  if (!lead) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
  return NextResponse.json({ lead, mensajes: listMensajes(lead.id) });
}

// PATCH /api/leads/:id — actualiza estado / temperatura / notas / confirmo_web
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const lead = getLead(id);
  if (!lead) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });

  const patch = (await req.json().catch(() => ({}))) as Partial<Lead>;

  // Si pasa a "contactado" por primera vez, sella la fecha.
  if (patch.estado === 'contactado' && !lead.contactado_en) {
    patch.contactado_en = new Date().toISOString();
  }

  updateLead(id, patch);
  return NextResponse.json({ lead: getLead(id) });
}
