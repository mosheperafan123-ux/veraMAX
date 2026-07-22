import { getDb, getLead, type Lead } from './db';

/**
 * Tracking de apertura de demo (sin IA, $0). La demo lleva un pixel 1×1 que,
 * al abrirse, pega a GET /api/track?lead=ID. Eso marca el lead como caliente y,
 * en la PRIMERA apertura, te avisa por WhatsApp. Requiere que la app sea
 * alcanzable públicamente (mismo túnel que el webhook de Evolution); si no hay
 * `VERA_PUBLIC_URL`, el generador no inyecta el pixel y todo sigue igual.
 */

// GIF transparente 1×1 (43 bytes). Sirve como cuerpo del pixel.
export const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

export interface AperturaResult {
  firstOpen: boolean;       // true si es la PRIMERA apertura de este lead
  lead: Lead | undefined;   // lead actualizado (o undefined si no existe)
}

/**
 * Registra una apertura de la demo del lead: incrementa el contador, guarda la
 * fecha y sube la temperatura a 'caliente' (alta intención). No cambia el estado
 * del pipeline. Devuelve si fue la primera apertura para avisar una sola vez.
 */
export function marcarDemoAbierta(leadId: number): AperturaResult {
  const lead = getLead(leadId);
  if (!lead) return { firstOpen: false, lead: undefined };
  const firstOpen = (lead.aperturas || 0) === 0;
  getDb()
    .prepare(
      `UPDATE leads
         SET aperturas = COALESCE(aperturas, 0) + 1,
             demo_abierta_en = @fecha,
             temperatura = 'caliente'
       WHERE id = @id`,
    )
    .run({ fecha: new Date().toISOString(), id: leadId });
  return { firstOpen, lead: getLead(leadId) };
}
