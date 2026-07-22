import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  waLink, escapeHtml, estrellas, redUrl, sitioUrl,
  ciudadDeDireccion, zonaDeDireccion, focoOdonto, unsplash, unsplashSrcset,
  nombreMarca, generateDemo, trackPixelUrl, mapaEmbedUrl,
} from '../lib/demo-generator';
import { normalizePhone } from '../lib/evolution';
import { normalizeWebsite } from '../lib/scraper';
import { TRANSPARENT_GIF } from '../lib/track';
import { esOptOut, dentroDeHorario } from '../lib/antiban';
import { nombreRespaldo, seleccionarParaBorrar, hayRespaldoDeHoy } from '../lib/backup';
import { buildMensaje, buildSeguimiento, demoUrlFor, NUM_PLANTILLAS, NUM_SEGUIMIENTOS } from '../lib/messages';
import type { Lead } from '../lib/db';

/** Lead de prueba completo; `over` sobrescribe campos para casos puntuales. */
function makeLead(over: Partial<Lead> = {}): Lead {
  return {
    id: 999001,
    nombre: 'Clínica Dental Sonrisa',
    categoria: 'odontologo',
    telefono: '3001234567',
    direccion: 'Cra 1 #2-3, Centro, Cali, Valle',
    maps_url: 'https://maps.google.com/x',
    rating: 4.7,
    resenas: 88,
    instagram: null,
    facebook: null,
    sitio_web: null,
    estado: 'nuevo',
    temperatura: 'frio',
    demo_url: null,
    confirmo_web: 0,
    seguimientos: 0,
    aperturas: 0,
    demo_abierta_en: null,
    notas: null,
    contactado_en: null,
    ultimo_contacto: null,
    creado_en: '2026-01-01 00:00:00',
    ...over,
  };
}

/* ----------------------------- waLink / teléfono ----------------------------- */

test('waLink: sin teléfono → #', () => {
  assert.equal(waLink(null), '#');
  assert.equal(waLink(''), '#');
});

test('waLink: celular de 10 dígitos antepone 57', () => {
  assert.equal(waLink('3001234567'), 'https://wa.me/573001234567');
});

test('waLink: número ya con prefijo 57 no se duplica', () => {
  assert.equal(waLink('573001234567'), 'https://wa.me/573001234567');
});

test('waLink: con mensaje agrega ?text= codificado', () => {
  const u = waLink('3001234567', 'hola mundo');
  assert.ok(u.startsWith('https://wa.me/573001234567?text='));
  assert.ok(u.includes('hola%20mundo'));
});

test('normalizePhone: limpia símbolos y antepone 57', () => {
  assert.equal(normalizePhone('3001234567'), '573001234567');
  assert.equal(normalizePhone('+57 300 123 4567'), '573001234567');
  assert.equal(normalizePhone('(300) 123-4567'), '573001234567');
});

/* ----------------------------- helpers de texto ----------------------------- */

test('escapeHtml: escapa < > & "', () => {
  assert.equal(escapeHtml('<b>a & "b"</b>'), '&lt;b&gt;a &amp; &quot;b&quot;&lt;/b&gt;');
});

test('estrellas: llenas y vacías según rating', () => {
  assert.equal(estrellas(5), '★★★★★');
  assert.equal(estrellas(4), '★★★★☆');
  assert.equal(estrellas(null), '★★★★★'); // default 5
  assert.equal(estrellas(4.7), '★★★★★'); // redondea a 5
});

test('redUrl: normaliza handle/URL de redes', () => {
  assert.equal(redUrl('instagram', '@clinica'), 'https://instagram.com/clinica');
  assert.equal(redUrl('facebook', 'MiPagina'), 'https://facebook.com/MiPagina');
  assert.equal(redUrl('instagram', 'https://instagram.com/x'), 'https://instagram.com/x');
  assert.equal(redUrl('instagram', null), '');
  assert.equal(redUrl('instagram', '   '), '');
});

test('sitioUrl: agrega https si falta', () => {
  assert.equal(sitioUrl('ejemplo.com'), 'https://ejemplo.com');
  assert.equal(sitioUrl('http://ejemplo.com'), 'http://ejemplo.com');
  assert.equal(sitioUrl(null), '');
});

/* ----------------------------- ubicación / foco ----------------------------- */

test('ciudadDeDireccion: penúltimo segmento útil', () => {
  assert.equal(ciudadDeDireccion('Cra 1 #2-3, Centro, Cali, Valle'), 'Cali');
  assert.equal(ciudadDeDireccion(null), 'tu ciudad');
  assert.equal(ciudadDeDireccion(''), 'tu ciudad');
});

test('zonaDeDireccion: segmento de barrio o null', () => {
  assert.equal(zonaDeDireccion('Cra 1 #2-3, Centro, Cali, Valle'), 'Centro');
  assert.equal(zonaDeDireccion('Cra 1 #2-3, Cali'), null); // < 3 segmentos
  assert.equal(zonaDeDireccion(null), null);
});

test('focoOdonto: detecta especialidad por el nombre', () => {
  assert.ok(focoOdonto('Ortodoncia Cali')?.h2.includes('Alineada'));
  assert.ok(focoOdonto('Centro de Implantes')?.h1.includes('Implantes'));
  assert.ok(focoOdonto('Diseño de Sonrisa Estética')?.h1.includes('Diseño'));
  assert.equal(focoOdonto('Consultorio General'), null);
});

test('unsplash / unsplashSrcset: URL e índice de anchos', () => {
  assert.ok(unsplash('abc', 800).includes('photo-abc?w=800'));
  const ss = unsplashSrcset('abc');
  assert.ok(ss.includes('480w') && ss.includes('1600w'));
  assert.equal(ss.split(',').length, 4);
});

test('nombreMarca: limpia nombres "rellenos de keywords"', () => {
  assert.equal(nombreMarca('Christian Urrego Odontología | Odontólogo en Cali | Implantes'), 'Christian Urrego Odontología');
  assert.equal(nombreMarca('Spa Renacer'), 'Spa Renacer');
  assert.equal(nombreMarca('Clínica Dental — Centro'), 'Clínica Dental');
  // sin separadores y muy largo → recorta con elipsis y no excede ~35
  const largo = nombreMarca('A'.repeat(60));
  assert.ok(largo.length <= 35 && largo.endsWith('…'));
});

/* ----------------------------- mensajes ----------------------------- */

test('demoUrlFor: pública (hosting) vs local', () => {
  const lead = makeLead();
  const prev = process.env.DEMOS_PUBLIC_BASE;
  process.env.DEMOS_PUBLIC_BASE = 'https://u.github.io/vera-demos';
  assert.equal(demoUrlFor(lead), 'https://u.github.io/vera-demos/999001/');
  delete process.env.DEMOS_PUBLIC_BASE;
  assert.ok(demoUrlFor(lead).endsWith('/demos/999001/index.html'));
  if (prev !== undefined) process.env.DEMOS_PUBLIC_BASE = prev;
});

test('buildMensaje: incluye nombre y URL del demo, y rota por id', () => {
  const a = makeLead({ id: 1 });
  const b = makeLead({ id: 2 });
  assert.ok(buildMensaje(a).includes('Clínica Dental Sonrisa'));
  assert.ok(buildMensaje(a).includes(demoUrlFor(a)));
  // ids con distinto módulo eligen plantilla distinta
  if (NUM_PLANTILLAS > 1) assert.notEqual(buildMensaje(a), buildMensaje(b));
});

test('buildSeguimiento: numera, hace clamp y mete la URL', () => {
  const lead = makeLead();
  const s1 = buildSeguimiento(lead, 1);
  const s2 = buildSeguimiento(lead, 2);
  assert.ok(s1.includes(demoUrlFor(lead)));
  if (NUM_SEGUIMIENTOS > 1) assert.notEqual(s1, s2);
  // clamp: 0 → primera plantilla; número enorme → última
  assert.equal(buildSeguimiento(lead, 0), s1);
  assert.equal(buildSeguimiento(lead, 999), buildSeguimiento(lead, NUM_SEGUIMIENTOS));
});

/* ----------------------------- generateDemo (integración) ----------------------------- */

function readAndClean(lead: Lead): string {
  const res = generateDemo(lead);
  const html = fs.readFileSync(res.filePath, 'utf-8');
  // limpiar la carpeta de prueba
  try { fs.rmSync(path.join(process.cwd(), 'public', 'demos', String(lead.id)), { recursive: true, force: true }); } catch { /* noop */ }
  return html;
}

test('generateDemo: lead completo → HTML sin placeholders y con piezas clave', () => {
  const html = readAndClean(makeLead({ id: 999001 }));
  assert.equal(html.match(/\{\{[A-Z_]+\}\}/g), null, 'no deben quedar placeholders {{...}}');
  assert.ok(html.includes('og:image'), 'tiene og:image');
  assert.ok(html.includes('srcset='), 'tiene srcset');
  assert.ok(html.includes('Clínica Dental Sonrisa'), 'tiene el nombre');
  assert.ok(html.includes('application/ld+json'), 'tiene JSON-LD');
});

test('generateDemo: guardas de regresión (SEO/preview/perf/marca)', () => {
  const prev = process.env.DEMOS_PUBLIC_BASE;
  process.env.DEMOS_PUBLIC_BASE = 'https://u.github.io/vera-demos';
  const html = readAndClean(makeLead({ id: 999010, nombre: 'Clínica X | Odontólogo en Cali | Implantes' }));
  if (prev !== undefined) process.env.DEMOS_PUBLIC_BASE = prev; else delete process.env.DEMOS_PUBLIC_BASE;
  // preview rico al compartir
  assert.ok(html.includes('property="og:image:width" content="1200"'), 'og:image:width 1200');
  assert.ok(html.includes('property="og:image:height" content="630"'), 'og:image:height 630');
  assert.ok(html.includes('name="twitter:card" content="summary_large_image"'), 'twitter card');
  assert.ok(html.includes('rel="canonical"'), 'canonical con hosting');
  // perf: imágenes responsivas
  assert.ok((html.match(/srcset=/g) || []).length >= 2, 'srcset en hero y confianza');
  // rendimiento
  assert.ok(html.includes('rel="preconnect" href="https://images.unsplash.com"'), 'preconnect unsplash');
  // marca corta en el nav (sin keyword-stuffing)
  const nav = html.match(/class="l1">([^<]*)</);
  assert.ok(nav && !nav[1].includes('|'), 'el nav usa la marca corta (sin "|")');
});

test('generateDemo: relUrl apunta a /index.html', () => {
  const res = generateDemo(makeLead({ id: 999002 }));
  assert.equal(res.relUrl, '/demos/999002/index.html');
  try { fs.rmSync(path.join(process.cwd(), 'public', 'demos', '999002'), { recursive: true, force: true }); } catch { /* noop */ }
});

test('generateDemo: escapa el nombre (anti-inyección de HTML)', () => {
  const html = readAndClean(makeLead({ id: 999003, nombre: 'Clínica <script>x</script> & Cía "Pro"' }));
  assert.ok(!html.includes('<script>x</script>'), 'el nombre no debe inyectar <script>');
  assert.ok(html.includes('&lt;script&gt;'), 'el nombre va escapado');
});

/* --------- casos límite: datos faltantes del lead (robustez del generador) --------- */

test('generateDemo: lead estética sin rating/reseñas/dirección/redes no rompe', () => {
  const html = readAndClean(makeLead({
    id: 999004, categoria: 'estetica', rating: null, resenas: null,
    direccion: null, telefono: null, maps_url: null,
    instagram: null, facebook: null, sitio_web: null,
  }));
  assert.equal(html.match(/\{\{[A-Z_]+\}\}/g), null, 'sin placeholders aun con datos faltantes');
  assert.ok(html.includes('Centro de estética'), 'usa el perfil de estética');
});

test('generateDemo: lead sin teléfono → wa.me/tel no quedan rotos', () => {
  const html = readAndClean(makeLead({ id: 999005, telefono: null }));
  assert.ok(!html.includes('wa.me/57?'), 'no arma un wa.me vacío con 57');
  assert.equal(html.match(/\{\{[A-Z_]+\}\}/g), null);
});

test('generateDemo: nombre muy largo no deja placeholders', () => {
  const html = readAndClean(makeLead({ id: 999006, nombre: 'A'.repeat(300) }));
  assert.equal(html.match(/\{\{[A-Z_]+\}\}/g), null);
});

/* --------- normalizeWebsite (targeting: ¿el negocio ya tiene web propia?) --------- */

test('normalizeWebsite: vacío/null/espacios → null', () => {
  assert.equal(normalizeWebsite(null), null);
  assert.equal(normalizeWebsite(''), null);
  assert.equal(normalizeWebsite('   '), null);
});

test('normalizeWebsite: dominio pelado se vuelve https://', () => {
  assert.equal(normalizeWebsite('clinicadental.com'), 'https://clinicadental.com');
});

test('normalizeWebsite: normaliza esquema/host/path (https, minúsculas, sin slash ni query)', () => {
  assert.equal(
    normalizeWebsite('http://WWW.Clinica.CO/agenda/?utm=maps'),
    'https://www.clinica.co/agenda',
  );
});

test('normalizeWebsite: dominios de Google no son web propia → null', () => {
  for (const u of [
    'https://www.google.com/maps/place/x',
    'https://maps.google.com/?cid=1',
    'https://business.google.com/site/abc',
    'https://goo.gl/maps/abc',
    'https://maps.app.goo.gl/abc',
    'https://g.co/kgs/abc',
  ]) assert.equal(normalizeWebsite(u), null, `debe rechazar ${u}`);
});

test('normalizeWebsite: redes/mensajería no cuentan como web propia → null', () => {
  for (const u of [
    'https://facebook.com/clinica',
    'https://www.instagram.com/clinica',
    'https://linktr.ee/clinica',
    'https://wa.me/573001234567',
  ]) assert.equal(normalizeWebsite(u), null, `debe rechazar ${u}`);
});

test('normalizeWebsite: cadena no-URL → null', () => {
  assert.equal(normalizeWebsite('no es una url'), null);
});

test('normalizeWebsite: sitio propio real se conserva', () => {
  assert.equal(
    normalizeWebsite('https://www.odontologiadelnorte.com'),
    'https://www.odontologiadelnorte.com',
  );
});

/* --------- tracking de apertura de demo (pixel + GIF) --------- */

test('trackPixelUrl: sin base pública → "" (tracking deshabilitado)', () => {
  assert.equal(trackPixelUrl(123, ''), '');
  assert.equal(trackPixelUrl(123, null), '');
});

test('trackPixelUrl: con base arma /api/track?lead=ID', () => {
  assert.equal(trackPixelUrl(123, 'https://abc.ngrok.io'), 'https://abc.ngrok.io/api/track?lead=123');
});

test('trackPixelUrl: ignora slash(es) final(es) de la base', () => {
  assert.equal(trackPixelUrl(7, 'https://abc.ngrok.io//'), 'https://abc.ngrok.io/api/track?lead=7');
});

test('trackPixelUrl: id inválido (0, negativo, decimal) → ""', () => {
  assert.equal(trackPixelUrl(0, 'https://x'), '');
  assert.equal(trackPixelUrl(-1, 'https://x'), '');
  assert.equal(trackPixelUrl(1.5, 'https://x'), '');
});

test('TRANSPARENT_GIF: es un GIF 1x1 válido', () => {
  assert.ok(TRANSPARENT_GIF.length > 0, 'no vacío');
  assert.equal(TRANSPARENT_GIF.subarray(0, 6).toString('ascii'), 'GIF89a', 'cabecera GIF');
});

/* --------- mapa de ubicación embebido (personalización #3) --------- */

test('mapaEmbedUrl: sin dirección → "" (sin mapa)', () => {
  assert.equal(mapaEmbedUrl(''), '');
  assert.equal(mapaEmbedUrl(null), '');
  assert.equal(mapaEmbedUrl('   '), '');
});

test('mapaEmbedUrl: arma embed de Google Maps (output=embed, sin API key)', () => {
  const u = mapaEmbedUrl('Cra 66 #13-45, Cali');
  assert.ok(u.startsWith('https://maps.google.com/maps?q='), 'usa el embed clásico');
  assert.ok(u.includes('output=embed'), 'modo embed');
  assert.ok(u.includes(encodeURIComponent('Cra 66 #13-45, Cali')), 'dirección url-encoded');
  assert.ok(!/key=/.test(u), 'no requiere API key');
});

test('generateDemo: con dirección inyecta el mapa embebido; sin placeholder', () => {
  const html = readAndClean(makeLead({ id: 999009, direccion: 'Cra 66 #13-45, San Fernando, Cali' }));
  assert.ok(html.includes('output=embed'), 'debe inyectar el iframe del mapa');
  assert.ok(/grayscale/.test(html), 'el mapa va en escala de grises (on-theme)');
  assert.equal(html.match(/\{\{[A-Z_]+\}\}/g), null, 'sin placeholders sueltos');
});

test('generateDemo: sin dirección no inyecta mapa ni deja placeholder', () => {
  const html = readAndClean(makeLead({ id: 999010, direccion: null }));
  assert.ok(!html.includes('output=embed'), 'no debe haber mapa sin dirección');
  assert.equal(html.match(/\{\{[A-Z_]+\}\}/g), null, 'sin placeholders sueltos');
});

/* --------- anti-baneo: opt-out + horario hábil (no quemar el número) --------- */

test('esOptOut: detecta frases de baja claras', () => {
  for (const t of [
    'No me interesa, gracias',
    'Por favor no me escriban más',
    'NO INSISTAN',
    'Quítenme de su lista',
    'me doy de baja',
    'Stop',
  ]) assert.equal(esOptOut(t), true, `debe ser opt-out: ${t}`);
});

test('esOptOut: NO marca respuestas normales/interesadas (sin falsos positivos)', () => {
  for (const t of [
    '¡Hola! Me interesa, ¿cuánto cuesta?',
    'No sé, déjame pensarlo',
    'Quiero eliminar mis caries',
    'Sí, cuéntame más',
    '',
  ]) assert.equal(esOptOut(t), false, `NO debe ser opt-out: ${t}`);
});

// Horario evaluado en hora de Colombia (UTC-5), independiente de la TZ del test.
const HCFG = { horaInicio: 8, horaFin: 19, dias: [0, 1, 2, 3, 4, 5, 6] };

test('dentroDeHorario: dentro del rango (9am COT) → true', () => {
  assert.equal(dentroDeHorario(new Date('2026-06-30T14:00:00Z'), HCFG), true);
});

test('dentroDeHorario: madrugada (2am COT) → false', () => {
  assert.equal(dentroDeHorario(new Date('2026-06-30T07:00:00Z'), HCFG), false);
});

test('dentroDeHorario: borde inicio inclusivo (8am COT) → true; fin exclusivo (7pm COT) → false', () => {
  assert.equal(dentroDeHorario(new Date('2026-06-30T13:00:00Z'), HCFG), true);  // 8:00 COT
  assert.equal(dentroDeHorario(new Date('2026-07-01T00:00:00Z'), HCFG), false); // 19:00 COT
});

test('dentroDeHorario: día no activo → false aunque la hora sirva', () => {
  // 2026-06-30 es martes (día 2) en COT; lo excluimos.
  assert.equal(dentroDeHorario(new Date('2026-06-30T14:00:00Z'), { horaInicio: 8, horaFin: 19, dias: [3, 4, 5, 6] }), false);
});

/* --------- backup de la base de datos (robustez) --------- */

test('nombreRespaldo: formato webleads-YYYYMMDD-HHmmss.db (UTC)', () => {
  assert.equal(nombreRespaldo(new Date('2026-06-30T14:05:09Z')), 'webleads-20260630-140509.db');
  assert.equal(nombreRespaldo(new Date('2026-01-02T03:04:05Z')), 'webleads-20260102-030405.db');
});

test('seleccionarParaBorrar: mantiene los N más recientes, devuelve el resto', () => {
  const nombres = [
    'webleads-20260630-090000.db',
    'webleads-20260629-090000.db',
    'webleads-20260628-090000.db',
    'webleads-20260627-090000.db',
    'webleads-20260626-090000.db',
  ];
  const borrar = seleccionarParaBorrar(nombres, 3);
  assert.deepEqual(borrar.sort(), ['webleads-20260626-090000.db', 'webleads-20260627-090000.db']);
});

test('seleccionarParaBorrar: con menos que el tope no borra nada; ignora archivos ajenos', () => {
  assert.deepEqual(seleccionarParaBorrar(['webleads-20260630-090000.db', 'otra-cosa.txt'], 3), []);
});

test('hayRespaldoDeHoy: detecta un respaldo del día (UTC)', () => {
  const hoy = new Date('2026-06-30T23:00:00Z');
  assert.equal(hayRespaldoDeHoy(['webleads-20260630-080000.db'], hoy), true);
  assert.equal(hayRespaldoDeHoy(['webleads-20260629-080000.db'], hoy), false);
  assert.equal(hayRespaldoDeHoy([], hoy), false);
});

test('generateDemo: sin VERA_PUBLIC_URL no inyecta pixel ni deja placeholder', () => {
  const prev = process.env.VERA_PUBLIC_URL;
  delete process.env.VERA_PUBLIC_URL;
  const html = readAndClean(makeLead({ id: 999007 }));
  assert.ok(!html.includes('/api/track?lead='), 'no debe haber pixel sin base pública');
  assert.equal(html.match(/\{\{[A-Z_]+\}\}/g), null, 'sin placeholders sueltos');
  if (prev !== undefined) process.env.VERA_PUBLIC_URL = prev;
});

test('generateDemo: con VERA_PUBLIC_URL inyecta el pixel del lead', () => {
  const prev = process.env.VERA_PUBLIC_URL;
  process.env.VERA_PUBLIC_URL = 'https://demo.tunnel.io';
  const html = readAndClean(makeLead({ id: 999008 }));
  assert.ok(
    html.includes('https://demo.tunnel.io/api/track?lead=999008'),
    'debe inyectar el pixel con la URL pública y el id del lead',
  );
  if (prev === undefined) delete process.env.VERA_PUBLIC_URL; else process.env.VERA_PUBLIC_URL = prev;
});
