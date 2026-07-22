import { NextResponse } from 'next/server';
import { listLeads, insertLead, type NewLead } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/leads — lista todos los leads
export async function GET() {
  return NextResponse.json({ leads: listLeads() });
}

// POST /api/leads — inserta uno o varios leads (desde el scraper). { leads: NewLead[] }
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const incoming: NewLead[] = Array.isArray(body.leads) ? body.leads : body.lead ? [body.lead] : [];
  if (!incoming.length) {
    return NextResponse.json({ error: 'No se enviaron leads' }, { status: 400 });
  }

  let guardados = 0;
  let saltados = 0;
  const ids: number[] = [];
  for (const lead of incoming) {
    if (!lead?.nombre) { saltados++; continue; }
    const id = insertLead(lead);
    if (id) { guardados++; ids.push(id); } else { saltados++; }
  }
  return NextResponse.json({ guardados, saltados, ids });
}
