import { NextResponse } from 'next/server';
import { getLeadByPhone, getLead, addMensaje, updateLead } from '@/lib/db';
import { notificarRespuesta, notificarOptOut } from '@/lib/notify';
import { esOptOut } from '@/lib/antiban';

export const dynamic = 'force-dynamic';

/**
 * Webhook de Evolution: recibe los mensajes ENTRANTES de WhatsApp y actualiza
 * el lead automáticamente (lo marca como respondió → tibio). Así el sistema
 * "se actualiza solo" cuando un negocio contesta, deja de ser candidato a la
 * limpieza automática de páginas, y te AVISA a tu WhatsApp para que entres a
 * responderle desde el panel. Sin IA.
 */

interface EvoKey { remoteJid?: string; fromMe?: boolean; id?: string; }
interface EvoMessage {
  conversation?: string;
  extendedTextMessage?: { text?: string };
  imageMessage?: { caption?: string };
  videoMessage?: { caption?: string };
}
interface EvoData { key?: EvoKey; message?: EvoMessage; pushName?: string; }

function textoDeMensaje(m?: EvoMessage): string {
  if (!m) return '';
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    '[adjunto]'
  );
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  // El payload puede traer data como objeto o como arreglo.
  const raw = (body?.data ?? body) as EvoData | EvoData[];
  const items: EvoData[] = Array.isArray(raw) ? raw : [raw];

  let actualizados = 0;
  for (const item of items) {
    const jid = item?.key?.remoteJid || '';
    // Ignora mensajes propios, grupos y estados.
    if (item?.key?.fromMe) continue;
    if (!jid || jid.endsWith('@g.us') || jid.includes('broadcast') || jid.includes('status@')) continue;

    const telefono = jid.split('@')[0] || '';
    const lead = getLeadByPhone(telefono);
    if (!lead) continue; // mensaje de alguien que no es un lead

    const texto = textoDeMensaje(item.message).slice(0, 2000);
    // Idempotencia: si Evolution reintenta el webhook, el id se repite → no
    // duplicamos el mensaje ni reprocesamos.
    const nuevo = addMensaje(lead.id, 'recibido', texto, item.key?.id || null);
    if (!nuevo) continue;

    // Opt-out (Habeas Data + protección del número): si pide la baja, se descarta
    // y NO se le vuelve a escribir (los seguimientos ya excluyen 'descartado').
    if (esOptOut(texto)) {
      const nota = `${lead.notas ? lead.notas + '\n' : ''}[auto] Opt-out el ${new Date().toISOString().slice(0, 10)}: "${texto.slice(0, 120)}"`;
      updateLead(lead.id, { estado: 'descartado', notas: nota, ultimo_contacto: new Date().toISOString() });
      actualizados++;
      await notificarOptOut(getLead(lead.id) ?? lead, texto);
      continue;
    }

    // Primera respuesta: pasa a "respondió" + "tibio". Si ya iba más avanzado, respeta el estado.
    const avanzado = ['interesado', 'cerrado', 'descartado'].includes(lead.estado);
    const eraSinResponder = lead.estado === 'contactado' || lead.estado === 'nuevo';
    updateLead(lead.id, {
      estado: avanzado ? lead.estado : 'respondio',
      temperatura: lead.temperatura === 'frio' ? 'tibio' : lead.temperatura,
      ultimo_contacto: new Date().toISOString(),
    });
    actualizados++;

    // Te avisa a tu WhatsApp solo en la PRIMERA respuesta de cada ronda (cuando
    // pasa de contactado/nuevo a respondió), para no saturarte con cada mensaje.
    if (eraSinResponder) {
      const fresco = getLead(lead.id) ?? lead;
      await notificarRespuesta(fresco, texto);
    }
  }

  // Evolution espera 200; devolvemos cuántos leads tocamos (útil para depurar).
  return NextResponse.json({ ok: true, actualizados });
}

// Permite verificar a mano que la ruta está viva.
export async function GET() {
  return NextResponse.json({ ok: true, hint: 'Webhook de Evolution activo. Configúralo con APP_WEBHOOK_URL.' });
}
