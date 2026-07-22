import { marcarDemoAbierta, TRANSPARENT_GIF } from '@/lib/track';
import { notificarAperturaDemo } from '@/lib/notify';

export const dynamic = 'force-dynamic';

/**
 * GET /api/track?lead=ID — pixel de seguimiento de apertura de demo.
 * Registra la apertura (marca el lead caliente; avisa en la primera) y devuelve
 * un GIF 1×1 transparente. Nunca falla hacia el navegador del lead: pase lo que
 * pase, responde el pixel.
 */
export async function GET(req: Request) {
  const leadId = Number(new URL(req.url).searchParams.get('lead'));
  if (Number.isInteger(leadId) && leadId > 0) {
    try {
      const { firstOpen, lead } = marcarDemoAbierta(leadId);
      if (firstOpen && lead) await notificarAperturaDemo(lead);
    } catch {
      /* el pixel SIEMPRE responde, aunque el registro falle */
    }
  }
  return new Response(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': String(TRANSPARENT_GIF.length),
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
  });
}
