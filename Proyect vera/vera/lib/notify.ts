import type { Lead } from './db';
import { sendMessage } from './evolution';

/**
 * Avisos a Moshe por WhatsApp (a su número personal). Es la pieza que cierra el
 * ciclo: cuando un cliente responde, el sistema te escribe a TI para que entres
 * al panel y le contestes. No usa IA: solo te reenvía lo que dijo el cliente.
 */

const NOTIFY = process.env.NOTIFY_PHONE || process.env.TEST_PHONE || '';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

/** ¿Está configurado el número de avisos? */
export function notifyConfigured(): boolean {
  return Boolean(NOTIFY);
}

/**
 * Te avisa que un cliente respondió. No bloquea el webhook: si no hay número o
 * Evolution falla, simplemente no envía (la respuesta ya quedó guardada en el CRM).
 */
export async function notificarRespuesta(lead: Lead, texto: string): Promise<void> {
  if (!NOTIFY) return;
  const aviso =
    `📩 *${lead.nombre}* respondió en WhatsApp:\n\n` +
    `"${texto.slice(0, 500)}"\n\n` +
    `Ábrelo para contestarle 👉 ${BASE_URL}/inbox`;
  try {
    await sendMessage(NOTIFY, aviso);
  } catch {
    /* nunca tumbar el webhook por un fallo de aviso */
  }
}

/**
 * Te avisa que un lead pidió la BAJA (opt-out). Quedó descartado automáticamente
 * y no se le vuelve a escribir. Solo para tu registro.
 */
export async function notificarOptOut(lead: Lead, texto: string): Promise<void> {
  if (!NOTIFY) return;
  const aviso =
    `🚫 *${lead.nombre}* pidió no ser contactado:\n\n` +
    `"${texto.slice(0, 300)}"\n\n` +
    `Lo descarté automáticamente. No se le escribirá más.`;
  try {
    await sendMessage(NOTIFY, aviso);
  } catch {
    /* nunca tumbar el webhook por un fallo de aviso */
  }
}

/**
 * Te avisa que un lead ABRIÓ su demo (señal de alta intención → ya quedó
 * caliente). Solo se llama en la primera apertura. No bloquea el pixel: si no
 * hay número o Evolution falla, no envía.
 */
export async function notificarAperturaDemo(lead: Lead): Promise<void> {
  if (!NOTIFY) return;
  const aviso =
    `👀 *${lead.nombre}* abrió su demo (ahora 🔥 caliente).\n\n` +
    `Buen momento para escribirle 👉 ${BASE_URL}/leads/${lead.id}`;
  try {
    await sendMessage(NOTIFY, aviso);
  } catch {
    /* nunca tumbar el pixel por un fallo de aviso */
  }
}
