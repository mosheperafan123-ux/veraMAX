/**
 * Cliente mínimo de Evolution API (local, Docker en localhost:8080).
 * Si la instancia no está conectada, todo cae con gracia al link wa.me.
 */

import { waLink } from './demo-generator';

const URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const KEY = process.env.EVOLUTION_API_KEY || '';
const INSTANCE = process.env.EVOLUTION_INSTANCE_NAME || 'webleads';

function headers() {
  return { 'Content-Type': 'application/json', apikey: KEY };
}

/** Normaliza a número con prefijo Colombia (57) y sin símbolos. */
export function normalizePhone(telefono: string): string {
  let d = telefono.replace(/\D/g, '');
  if (d.length === 10) d = '57' + d;
  return d;
}

/** ¿La instancia está conectada (open)? Nunca lanza: devuelve false ante error. */
export async function checkStatus(): Promise<boolean> {
  try {
    const res = await fetch(`${URL}/instance/connectionState/${INSTANCE}`, {
      headers: headers(),
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.instance?.state === 'open' || data?.state === 'open';
  } catch {
    return false;
  }
}

export interface QrResult {
  conectado: boolean;
  base64?: string; // data URL del QR
  pairingCode?: string;
  error?: string;
}

/** Crea la instancia si NO existe (una sola vez). No la recrea si ya está. */
export async function ensureInstance(): Promise<void> {
  try {
    const res = await fetch(`${URL}/instance/fetchInstances?instanceName=${INSTANCE}`, { headers: headers(), cache: 'no-store' });
    const list = res.ok ? await res.json().catch(() => []) : [];
    const existe = Array.isArray(list) && list.some((i: { instance?: { instanceName?: string } }) => i?.instance?.instanceName === INSTANCE);
    if (!existe) {
      await fetch(`${URL}/instance/create`, {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ instanceName: INSTANCE, qrcode: true }),
      }).catch(() => {});
    }
  } catch { /* la creará el connect si hace falta */ }
}

/** Devuelve el QR (o el estado conectado). NO recrea la instancia en cada llamada. */
export async function getQr(): Promise<QrResult> {
  try {
    // Si ya está conectada, no hay QR (y NO tocamos la conexión para no reemplazarla).
    if (await checkStatus()) return { conectado: true };

    await ensureInstance();

    const res = await fetch(`${URL}/instance/connect/${INSTANCE}`, { headers: headers(), cache: 'no-store' });
    if (!res.ok) return { conectado: false, error: `connect ${res.status}` };
    const data = await res.json();
    const base64: string | undefined = data?.base64 || data?.qrcode?.base64;
    const pairingCode: string | undefined = data?.pairingCode || data?.code || data?.qrcode?.code;
    return { conectado: false, base64, pairingCode };
  } catch (e) {
    return { conectado: false, error: (e as Error).message };
  }
}

/**
 * Registra el webhook de mensajes entrantes en la instancia (idempotente).
 * Evolution (en Docker) llama a esta URL cuando llega un mensaje. Como el app
 * corre en el host, la URL debe ser accesible desde el contenedor — normalmente
 * http://host.docker.internal:3000/api/webhook/evolution
 */
export async function setWebhook(): Promise<boolean> {
  const url = process.env.APP_WEBHOOK_URL;
  if (!url) return false;
  try {
    const res = await fetch(`${URL}/webhook/set/${INSTANCE}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        // Evolution v1: enabled + url + events filtrados a mensajes entrantes.
        enabled: true,
        url,
        webhook_by_events: false,
        events: ['MESSAGES_UPSERT'],
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export interface SendResult {
  ok: boolean;
  via: 'evolution' | 'wa.me';
  fallbackLink?: string;
  error?: string;
}

/** Envía un mensaje vía Evolution. Si falla, devuelve link wa.me como fallback. */
export async function sendMessage(telefono: string, text: string): Promise<SendResult> {
  const number = normalizePhone(telefono);
  try {
    // Evolution API v1.x espera { number, textMessage: { text } } (la v2 usa { number, text }).
    const res = await fetch(`${URL}/message/sendText/${INSTANCE}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        number,
        options: { delay: 1000, presence: 'composing' },
        textMessage: { text },
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return { ok: false, via: 'wa.me', fallbackLink: waLink(telefono, text), error: err };
    }
    return { ok: true, via: 'evolution' };
  } catch (e) {
    return { ok: false, via: 'wa.me', fallbackLink: waLink(telefono, text), error: (e as Error).message };
  }
}

/**
 * Envía varios mensajes (globos) en secuencia, con una pausa tipo humano entre
 * cada uno. Devuelve el resultado del último envío. Si alguno falla, corta y
 * devuelve ese fallo (con link wa.me del texto completo como respaldo).
 */
export async function sendSecuencia(telefono: string, partes: string[]): Promise<SendResult> {
  const lista = partes.map((p) => p.trim()).filter(Boolean);
  if (!lista.length) return { ok: false, via: 'wa.me', error: 'sin mensajes' };
  let last: SendResult = { ok: false, via: 'wa.me' };
  for (let i = 0; i < lista.length; i++) {
    last = await sendMessage(telefono, lista[i]);
    if (!last.ok) {
      return { ...last, fallbackLink: waLink(telefono, lista.join('\n\n')) };
    }
    // Pausa humana entre globos (no después del último).
    if (i < lista.length - 1) {
      const espera = 1500 + Math.floor(Math.random() * 2500); // 1.5–4s
      await new Promise((r) => setTimeout(r, espera));
    }
  }
  return last;
}

export { waLink as generateWALink };
