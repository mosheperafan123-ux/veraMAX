import type { Lead } from './db';

/**
 * Plantillas de mensaje rotativas (anti-baneo: nunca el mismo texto idéntico).
 * El {{DEMO_URL}} se reemplaza por la URL absoluta del demo del lead.
 */
const PLANTILLAS: ((n: string) => string)[] = [
  (n) =>
    `¡Hola! 🙌 Soy diseñador web y al ver *${n}* en Google Maps me animé a hacerles una página de muestra (sin compromiso): {{DEMO_URL}} Me encantaría saber su opinión.`,
  (n) =>
    `Hola 👋 Soy diseñador web. Vi *${n}* en Google y me animé a armarles una página de muestra, sin costo verla: {{DEMO_URL}} ¿Les gustaría darle un vistazo?`,
  (n) =>
    `Buenas 😊 Soy diseñador web y encontré *${n}* en Google Maps. Les hice una página de muestra sin compromiso para mostrarles cómo se vería: {{DEMO_URL}} ¿Qué les parece?`,
];

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

/** URL del demo: la pública (hosting) si está configurada; si no, la local. */
export function demoUrlFor(lead: Lead): string {
  const publicBase = process.env.DEMOS_PUBLIC_BASE;
  if (publicBase) return `${publicBase.replace(/\/$/, '')}/${lead.id}/`; // GitHub Pages resuelve el índice
  return `${BASE_URL}/demos/${lead.id}/index.html`; // Next no resuelve índices de carpeta
}

/** Devuelve una plantilla (rotando por id del lead para variar el texto). */
export function buildMensaje(lead: Lead): string {
  const idx = lead.id % PLANTILLAS.length;
  return PLANTILLAS[idx](lead.nombre).replaceAll('{{DEMO_URL}}', demoUrlFor(lead));
}

export const NUM_PLANTILLAS = PLANTILLAS.length;

/**
 * Plantillas de SEGUIMIENTO (sin IA). Mensajes naturales, en la voz de Moshe,
 * para reactivar a un lead que fue contactado y no respondió. El índice 0 es el
 * primer recordatorio (suave); el 1 el segundo (con un empujón de valor/cierre).
 */
const SEGUIMIENTOS: ((n: string) => string)[] = [
  (n) =>
    `Hola de nuevo 👋 Soy Moshe. ¿Alcanzaste a ver la página de muestra que les hice para *${n}*? Me encantaría saber qué te pareció 🙂 Te la dejo otra vez por aquí: {{DEMO_URL}}`,
  (n) =>
    `¡Hola! 🙌 Te escribo una última vez por *${n}*. La página de muestra sigue disponible aquí: {{DEMO_URL}} — si te gusta, la dejamos lista y publicada esta misma semana. ¿La activamos? Si no es el momento, no hay problema 🙂`,
];

export const NUM_SEGUIMIENTOS = SEGUIMIENTOS.length;

/**
 * Construye el mensaje de seguimiento N (1-based) para un lead.
 * Si N excede las plantillas, usa la última.
 */
export function buildSeguimiento(lead: Lead, numero: number): string {
  const idx = Math.min(Math.max(numero, 1), SEGUIMIENTOS.length) - 1;
  return SEGUIMIENTOS[idx](lead.nombre).replaceAll('{{DEMO_URL}}', demoUrlFor(lead));
}
