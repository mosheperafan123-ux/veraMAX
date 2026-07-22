import { NextResponse } from 'next/server';
import { getLead, updateLead, addMensaje, mensajesEnviadosHoy } from '@/lib/db';
import { checkStatus, sendMessage, generateWALink, setWebhook } from '@/lib/evolution';
import { buildMensaje } from '@/lib/messages';
import { getAjustes, puedeEnviarAhora } from '@/lib/antiban';

export const dynamic = 'force-dynamic';

// Modo prueba: redirige TODOS los envíos al número de prueba y NO toca el lead real.
const TEST_MODE = process.env.TEST_MODE === 'true';
const TEST_PHONE = process.env.TEST_PHONE || '';

// GET /api/whatsapp — estado de la instancia + contador anti-baneo
export async function GET() {
  const conectado = await checkStatus();
  // Registra el webhook de respuestas entrantes (idempotente, no bloquea si falla).
  if (conectado) void setWebhook();
  const enviadosHoy = mensajesEnviadosHoy();
  const { limiteDiario } = getAjustes();
  const ventana = puedeEnviarAhora();
  return NextResponse.json({
    conectado,
    enviadosHoy,
    limite: limiteDiario,
    restantes: Math.max(0, limiteDiario - enviadosHoy),
    enHorario: ventana.ok,
    motivoHorario: ventana.motivo ?? null,
    testMode: TEST_MODE,
    testPhone: TEST_MODE ? TEST_PHONE : null,
  });
}

// POST /api/whatsapp — envía el mensaje de un lead. { leadId, texto? }
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const leadId = Number(body.leadId);
  const lead = getLead(leadId);
  if (!lead) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
  if (!lead.telefono) return NextResponse.json({ error: 'El lead no tiene teléfono' }, { status: 400 });

  const { limiteDiario } = getAjustes();

  // Anti-baneo 1: horario hábil (no en modo prueba, para poder testear a cualquier hora).
  if (!TEST_MODE) {
    const ventana = puedeEnviarAhora();
    if (!ventana.ok) {
      return NextResponse.json({ error: ventana.motivo, fueraDeHorario: true }, { status: 409 });
    }
  }

  // Anti-baneo 2: límite diario.
  const enviadosHoy = mensajesEnviadosHoy();
  if (enviadosHoy >= limiteDiario) {
    return NextResponse.json(
      { error: `Límite diario alcanzado (${limiteDiario}). Continúa mañana para proteger tu número.`, limite: limiteDiario },
      { status: 429 }
    );
  }

  const texto: string = (body.texto && String(body.texto)) || buildMensaje(lead);

  // MODO PRUEBA: enviamos al número de prueba y NO modificamos el lead real.
  if (TEST_MODE) {
    if (!TEST_PHONE) {
      return NextResponse.json({ error: 'TEST_MODE activo pero falta TEST_PHONE en .env.local.' }, { status: 400 });
    }
    const r = await sendMessage(TEST_PHONE, `🧪 PRUEBA (simulación a ${lead.nombre})\n\n${texto}`);
    if (r.ok) {
      return NextResponse.json({ ok: true, via: r.via, testMode: true, sentTo: TEST_PHONE });
    }
    return NextResponse.json({ ok: false, via: 'wa.me', testMode: true, fallbackLink: r.fallbackLink, texto, error: r.error });
  }

  const result = await sendMessage(lead.telefono, texto);

  if (result.ok) {
    // Registra el mensaje y marca el lead como contactado.
    addMensaje(lead.id, 'enviado', texto);
    const now = new Date().toISOString();
    updateLead(lead.id, {
      estado: lead.estado === 'nuevo' ? 'contactado' : lead.estado,
      ultimo_contacto: now,
      contactado_en: lead.contactado_en || now,
    });
    return NextResponse.json({ ok: true, via: result.via, enviadosHoy: enviadosHoy + 1, restantes: limiteDiario - enviadosHoy - 1 });
  }

  // Fallback: devolvemos el link wa.me para envío manual.
  return NextResponse.json({
    ok: false,
    via: 'wa.me',
    fallbackLink: result.fallbackLink || generateWALink(lead.telefono, texto),
    texto,
    error: result.error,
  });
}
