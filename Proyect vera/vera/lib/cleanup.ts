import fs from 'node:fs';
import path from 'node:path';
import { leadsExpirados, updateLead } from './db';
import { publishDemos, isDeployConfigured } from './deploy';

/**
 * Limpieza automática de páginas: borra los demos de leads que fueron
 * contactados hace más de `dias` días y NO respondieron. Libera espacio en
 * GitHub Pages y mantiene online solo a los prospectos vivos.
 *
 * Un lead que respondió pasa a estado 'respondio' (vía webhook), así que queda
 * automáticamente excluido de esta limpieza.
 */

const DEMOS_DIR = path.join(process.cwd(), 'public', 'demos');

export interface CleanupResult {
  dias: number;
  eliminados: { id: number; nombre: string }[];
  publicado: boolean;
  liveOk?: boolean;
  error?: string;
}

export async function cleanupDemos(dias?: number, opts?: { publicar?: boolean }): Promise<CleanupResult> {
  const limite = dias ?? Number(process.env.DEMO_EXPIRE_DAYS || 3);
  const publicar = opts?.publicar ?? true;
  const expirados = leadsExpirados(limite);
  const eliminados: { id: number; nombre: string }[] = [];

  for (const lead of expirados) {
    // Borra la carpeta del demo local.
    const dir = path.join(DEMOS_DIR, String(lead.id));
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ya no existe */ }

    // Marca el lead: sin demo + descartado, con nota de trazabilidad.
    const nota = `${lead.notas ? lead.notas + '\n' : ''}[auto] Página eliminada el ${new Date().toISOString().slice(0, 10)} por ${limite} días sin respuesta.`;
    updateLead(lead.id, { demo_url: null, estado: 'descartado', notas: nota });
    eliminados.push({ id: lead.id, nombre: lead.nombre });
  }

  if (!eliminados.length) {
    return { dias: limite, eliminados, publicado: false };
  }

  // Republica para que las páginas borradas dejen de existir online (404).
  if (publicar && isDeployConfigured()) {
    const r = await publishDemos();
    return { dias: limite, eliminados, publicado: r.ok, liveOk: r.live, error: r.error };
  }

  return { dias: limite, eliminados, publicado: false };
}
