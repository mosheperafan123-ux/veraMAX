import { scrapeGoogleMaps, type ScrapedBusiness } from '@/lib/scraper';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * POST /api/scrape — corre el scraper y devuelve resultados en streaming
 * (NDJSON: una línea JSON por negocio). El dashboard los va mostrando en vivo.
 * Body: { query, ciudad, cantidad }
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const query = String(body.query || '').trim();
  const ciudad = String(body.ciudad || '').trim();
  const cantidad = Math.min(Math.max(Number(body.cantidad) || 20, 1), 60);

  if (!query || !ciudad) {
    return new Response(JSON.stringify({ error: 'Faltan query y ciudad' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
      try {
        send({ type: 'start', query, ciudad, cantidad });
        const onItem = (b: ScrapedBusiness) => send({ type: 'item', business: b });
        const all = await scrapeGoogleMaps({ query, ciudad, cantidad }, onItem);
        send({ type: 'done', total: all.length });
      } catch (e) {
        send({ type: 'error', error: (e as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}
