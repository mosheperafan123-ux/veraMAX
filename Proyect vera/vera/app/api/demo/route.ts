import { NextResponse } from 'next/server';
import { getLead, updateLead } from '@/lib/db';
import { generateDemo } from '@/lib/demo-generator';
import { publishDemos, isDeployConfigured } from '@/lib/deploy';

export const dynamic = 'force-dynamic'; // nota: nunca cachear — el demo cambia por lead y al regenerar
export const maxDuration = 300; // nota: republicar hace poll hasta ~90s a GitHub Pages; subimos el límite

// POST /api/demo — genera (o regenera) el demo de un lead y, si el hosting está
// configurado, REPUBLICA a GitHub Pages para que el link sirva la versión nueva.
// Sin republicar, GitHub seguiría mostrando la página vieja tras "Regenerar".
// Body: { leadId, republish? }  → republish por defecto true (false lo usa el flujo
// "Generar, publicar y enviar", que publica en su propio paso para no subir 2 veces).
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})); // nota: tolera body vacío/no-JSON
  const leadId = Number(body.leadId); // nota: id del lead a (re)generar
  const republish = body.republish !== false; // nota: republicar salvo que se pida explícitamente false
  const lead = getLead(leadId);
  if (!lead) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });

  try {
    const result = generateDemo(lead); // nota: reescribe public/demos/{id}/index.html (find-and-replace, sin IA)
    updateLead(leadId, { demo_url: result.relUrl }); // nota: guarda /demos/{id}/index.html en la fila del lead

    // nota: republicar = empujar TODO public/demos en 1 commit a GitHub Pages y esperar (poll)
    // a que el link del lead responda 200. Solo si el hosting está configurado en .env.local.
    let publish = null;
    if (republish && isDeployConfigured()) {
      publish = await publishDemos(leadId);
    }
    return NextResponse.json({ ok: true, demo_url: result.relUrl, publish });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
