/**
 * CLI del scraper: corre Google Maps y guarda en SQLite.
 * Uso: npm run scrape -- --query "estéticas" --ciudad "Cali" --cantidad 30
 */
import { scrapeGoogleMaps } from '../lib/scraper';
import { insertLead, getDb } from '../lib/db';

function arg(name: string, def: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

async function main() {
  const query = arg('query', 'odontólogos');
  const ciudad = arg('ciudad', 'Cali');
  const cantidad = parseInt(arg('cantidad', '20'), 10);

  console.log(`🔍 Buscando "${query}" en ${ciudad} (objetivo: ${cantidad})…`);

  let guardados = 0;
  const all = await scrapeGoogleMaps({ query, ciudad, cantidad }, (b) => {
    const id = insertLead(b);
    if (id) { guardados++; console.log(`  ✓ ${b.nombre} — ${b.telefono}`); }
    else console.log(`  · ${b.nombre} (duplicado o sin teléfono)`);
  });

  console.log(`\n✅ ${all.length} negocios procesados, ${guardados} nuevos guardados.`);
  getDb().close();
}

main().catch((e) => { console.error('Error:', e); process.exit(1); });
