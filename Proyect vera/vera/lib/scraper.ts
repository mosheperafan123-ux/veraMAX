import type { Categoria } from './db';

/**
 * Scraper de Google Maps con Playwright (headless).
 * Hace scroll en el panel de resultados y extrae negocios.
 * Rate-limit + delays aleatorios para ser respetuoso y evitar bloqueos.
 *
 * NOTA: Google Maps cambia su DOM con frecuencia. Si la extracción falla,
 * revisa los selectores en extractFromPanel(). Es el punto más frágil del MVP.
 */

export interface ScrapeInput {
  query: string;   // p.ej. "odontólogos"
  ciudad: string;  // p.ej. "Cali"
  cantidad: number;
}

export interface ScrapedBusiness {
  nombre: string;
  categoria: Categoria | null;
  telefono: string | null;
  direccion: string | null;
  maps_url: string | null;
  rating: number | null;
  resenas: number | null;
  sitio_web: string | null; // web PROPIA del negocio (null = candidato ideal del pitch)
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const jitter = (min: number, max: number) => min + Math.random() * (max - min);

// Dominios que NO cuentan como "web propia": Google (Maps/Business/shortlinks) y
// redes/mensajería. Un negocio cuya única presencia es Facebook/Instagram sigue
// siendo un candidato ideal — necesita una web de verdad.
const HOST_NO_PROPIO = /(^|\.)(google\.[a-z.]+|goo\.gl|g\.co|facebook\.com|fb\.com|instagram\.com|linktr\.ee|wa\.me|whatsapp\.com|t\.me|tiktok\.com)$/i;

/**
 * Normaliza la URL del botón "Sitio web" de Google Maps a una web propia limpia
 * (`https://host[/path]`, host en minúsculas, sin slash final ni query), o `null`
 * si no hay una web propia real (vacío, no-URL, Google o redes). Es la señal de
 * targeting: `null` = el negocio NO tiene web → candidato ideal para el pitch.
 */
export function normalizeWebsite(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let s = String(raw).trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  let u: URL;
  try { u = new URL(s); } catch { return null; }
  const host = u.hostname.toLowerCase();
  if (!host.includes('.')) return null;          // no es un dominio
  if (HOST_NO_PROPIO.test(host)) return null;    // Google o redes → no es web propia
  const ruta = u.pathname.replace(/\/+$/, '');   // sin slash final; descarta query/hash
  return `https://${host}${ruta}`;
}

/** Clasifica la categoría a partir de la query. */
function categoriaDeQuery(query: string): Categoria | null {
  const q = query.toLowerCase();
  if (/odont|dental|dentist/.test(q)) return 'odontologo';
  if (/estétic|estetic|spa|belleza|skin|piel/.test(q)) return 'estetica';
  return null;
}

/**
 * Ejecuta el scraping. `onItem` se llama por cada negocio extraído (streaming).
 */
export async function scrapeGoogleMaps(
  input: ScrapeInput,
  onItem?: (b: ScrapedBusiness) => void
): Promise<ScrapedBusiness[]> {
  // Import dinámico: Playwright solo se carga al ejecutar el scraper.
  const { chromium } = await import('playwright');
  const categoria = categoriaDeQuery(input.query);
  const results: ScrapedBusiness[] = [];
  const vistos = new Set<string>();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    locale: 'es-CO',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  try {
    const q = encodeURIComponent(`${input.query} en ${input.ciudad}`);
    await page.goto(`https://www.google.com/maps/search/${q}?hl=es`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });

    // Aceptar cookies si aparece el consentimiento.
    try {
      const consent = page.locator('button:has-text("Aceptar todo"), button:has-text("Rechazar todo")').first();
      if (await consent.isVisible({ timeout: 4000 })) await consent.click();
    } catch { /* sin banner */ }

    // Esperar el panel de resultados (feed).
    const feedSel = 'div[role="feed"]';
    await page.waitForSelector(feedSel, { timeout: 20000 });

    let intentosSinCrecer = 0;
    while (results.length < input.cantidad && intentosSinCrecer < 6) {
      // Tarjetas de resultados: enlaces a /maps/place/
      const cards = await page.locator(`${feedSel} a[href*="/maps/place/"]`).all();

      for (const card of cards) {
        if (results.length >= input.cantidad) break;
        const href = await card.getAttribute('href').catch(() => null);
        if (!href || vistos.has(href)) continue;

        try {
          await card.click();
          // Espera el TÍTULO del panel de detalle (no el h1 oculto "Resultados").
          await page.waitForSelector('h1.DUwDvf', { timeout: 8000 }).catch(() => {});
          await sleep(jitter(500, 1000)); // deja cargar el panel de detalle

          const biz = await extractFromPanel(page, href, categoria);
          vistos.add(href);

          if (biz && biz.telefono) {
            results.push(biz);
            onItem?.(biz);
          }
          await sleep(jitter(500, 1200)); // rate-limit ~1 req/seg
        } catch {
          vistos.add(href);
        }
      }

      // Scroll del feed para cargar más.
      const before = results.length;
      await page.locator(feedSel).evaluate((el) => el.scrollBy(0, el.scrollHeight));
      await sleep(jitter(1200, 2200));
      intentosSinCrecer = results.length > before ? 0 : intentosSinCrecer + 1;
    }
  } finally {
    await browser.close();
  }

  return results;
}

/** Extrae los campos del panel de detalle abierto. */
async function extractFromPanel(
  page: import('playwright').Page,
  href: string,
  categoria: Categoria | null
): Promise<ScrapedBusiness | null> {
  // El nombre real es el título del panel de detalle. Google Maps mantiene
  // además un h1 oculto "Resultados" en el feed, así que NO usamos h1.first().
  let nombre: string | null = null;
  // 1) Título del panel (clase estable desde hace años).
  const titulo = await page.locator('h1.DUwDvf').first().textContent().catch(() => null);
  if (titulo && titulo.trim()) nombre = titulo.trim();
  // 2) aria-label del panel principal.
  if (!nombre) {
    const al = await page.locator('div[role="main"][aria-label]').first().getAttribute('aria-label').catch(() => null);
    if (al && !/^(resultados|results|mapa|map)$/i.test(al.trim())) nombre = al.trim();
  }
  // 3) Cualquier h1 que no sea "Resultados".
  if (!nombre) {
    const h1s = await page.locator('h1').allTextContents().catch(() => [] as string[]);
    nombre = h1s.map((s) => s.trim()).find((s) => s && !/^resultados$/i.test(s)) || null;
  }
  if (!nombre) return null;

  // Rating y reseñas (suelen estar en spans con aria-label).
  let rating: number | null = null;
  let resenas: number | null = null;
  try {
    const ratingTxt = await page.locator('div.F7nice span[aria-hidden="true"]').first().textContent({ timeout: 2000 });
    if (ratingTxt) rating = parseFloat(ratingTxt.replace(',', '.')) || null;
    const resenasTxt = await page.locator('div.F7nice span[aria-label*="reseña"], div.F7nice span[aria-label*="opinion"]').first().getAttribute('aria-label');
    if (resenasTxt) resenas = parseInt(resenasTxt.replace(/\D/g, ''), 10) || null;
  } catch { /* sin rating */ }

  // Teléfono y dirección: botones con data-item-id.
  let telefono: string | null = null;
  let direccion: string | null = null;
  try {
    const telBtn = page.locator('button[data-item-id^="phone:tel:"]').first();
    const tel = await telBtn.getAttribute('data-item-id', { timeout: 2000 }).catch(() => null);
    if (tel) telefono = tel.replace('phone:tel:', '').trim();
  } catch { /* sin tel */ }
  try {
    const dirBtn = page.locator('button[data-item-id="address"]').first();
    const aria = await dirBtn.getAttribute('aria-label', { timeout: 2000 }).catch(() => null);
    if (aria) direccion = aria.replace(/^Dirección:\s*/i, '').trim();
  } catch { /* sin dirección */ }

  // Sitio web: enlace "authority" del panel. Lo normalizamos para descartar
  // Google/redes; null = el negocio no tiene web propia (candidato ideal).
  let sitio_web: string | null = null;
  try {
    const webLink = page.locator('a[data-item-id="authority"]').first();
    const href2 = await webLink.getAttribute('href', { timeout: 2000 }).catch(() => null);
    sitio_web = normalizeWebsite(href2);
  } catch { /* sin sitio web */ }

  return {
    nombre,
    categoria,
    telefono,
    direccion,
    maps_url: href,
    rating,
    resenas,
    sitio_web,
  };
}
