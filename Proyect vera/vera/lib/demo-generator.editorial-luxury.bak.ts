import fs from 'node:fs';
import path from 'node:path';
import type { Lead, Categoria } from './db';

/**
 * Generador de demos SIN IA: lee templates/base/index.html y reemplaza
 * los {{placeholders}} con los datos del negocio. Escribe el resultado en
 * public/demos/{id}/index.html (servible en /demos/{id}/).
 */

const TEMPLATE_PATH = path.join(process.cwd(), 'templates', 'base', 'index.html');
const DEMOS_DIR = path.join(process.cwd(), 'public', 'demos');

/** Marca del freelancer / agencia (configurable por env). */
const VERA_BRAND = process.env.NEXT_PUBLIC_VERA_BRAND || 'Vera';

interface Servicio { nombre: string; desc: string; }
interface Diferenciador { icon: string; nombre: string; desc: string; }
interface ValueItem { item: string; sub: string; valor: string; }
interface Oferta { titulo: string; lead: string; valorNormal: string; precio: string; precioSub: string; }
interface CatProfile {
  label: string;
  accent: string;
  accentDeep: string;
  heroTitulo1: string;
  heroTitulo2: string;
  heroLead: string;
  manifiesto: string;
  manifiestoSub: string;
  stat3v: string;
  stat3l: string;
  servicios: Servicio[];
  diferenciadores: Diferenciador[];
  valueStack: ValueItem[];
  oferta: Oferta;
  ticker: string[];
  testimonios: [string, string, string];
  faq: { q: string; a: string }[];
  heroImg: string;   // imagen del hero (óvalo orgánico sobre la tarjeta de contacto)
  bannerImg: string;
  bannerQuote: string;
  confiImg: string;
}

/** Construye URL de imagen Unsplash optimizada (gratis, hotlink permitido). */
export function unsplash(id: string, w = 1600): string {
  return `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;
}

/** srcset multi-ancho para una imagen Unsplash: el navegador baja el tamaño justo (ahorra datos en móvil). */
export function unsplashSrcset(id: string, widths = [480, 768, 1100, 1600]): string {
  return widths.map((w) => `${unsplash(id, w)} ${w}w`).join(', ');
}

// Íconos (paths SVG, stroke) para los diferenciadores.
const ICON = {
  tooth: 'M12 2c-2 0-3 1-4.5 1S5 2 4 3.5 3 8 4 12s1.5 8 2.5 8 1.5-3 2-5 1-2 1.5-2 1 0 1.5 2 1 5 2 5 2-4 2.5-8 1.5-7 0-8.5S15 3 13.5 3 14 2 12 2z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z',
  spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18',
  clock: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  wallet: 'M3 7h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zM3 7l2-3h11l2 3M16 13h.01',
};

const PERFILES: Record<Categoria, CatProfile> = {
  odontologo: {
    label: 'Clínica odontológica',
    accent: '#3E6F66', // teal salud
    accentDeep: '#2C5249',
    heroTitulo1: 'Tu mejor sonrisa,',
    heroTitulo2: 'en las mejores manos.',
    heroLead:
      'Odontología de alto nivel, cálida y sin dolor. Diagnóstico preciso, tecnología de punta y un equipo que diseña cada tratamiento pensando en ti —y en cómo te sientes en la silla.',
    manifiesto: 'Una sonrisa sana cambia la forma en que <em>vives</em>.',
    manifiestoSub:
      'Por eso combinamos profesionales con experiencia, equipos de última generación y un trato humano que te hace sentir en confianza desde que entras.',
    stat3v: '15+',
    stat3l: 'Años de experiencia',
    servicios: [
      { nombre: 'Odontología general', desc: 'Limpiezas, calzas y revisiones para mantener tu boca sana.' },
      { nombre: 'Ortodoncia', desc: 'Brackets y alineadores invisibles para alinear tu sonrisa.' },
      { nombre: 'Blanqueamiento dental', desc: 'Recupera el brillo natural de tus dientes en una sesión.' },
      { nombre: 'Implantes y prótesis', desc: 'Reemplaza dientes perdidos con soluciones fijas y naturales.' },
      { nombre: 'Diseño de sonrisa', desc: 'Carillas y estética dental diseñadas para ti.' },
    ],
    diferenciadores: [
      { icon: ICON.tooth, nombre: 'Tecnología de punta', desc: 'Radiografía digital, escáner intraoral y equipos modernos para diagnósticos precisos y tratamientos cómodos.' },
      { icon: ICON.heart, nombre: 'Atención sin dolor', desc: 'Técnicas mínimamente invasivas y sedación para que tu experiencia sea tranquila, incluso si te dan nervios.' },
      { icon: ICON.wallet, nombre: 'Planes a tu medida', desc: 'Presupuestos claros, sin sorpresas, y opciones de financiación para que cuides tu salud sin preocupaciones.' },
    ],
    valueStack: [
      { item: 'Valoración con un odontólogo', sub: 'Revisamos tu caso a fondo, sin afán.', valor: '$80.000' },
      { item: 'Diagnóstico y radiografía digital', sub: 'Imagen precisa para no dejar nada al azar.', valor: '$60.000' },
      { item: 'Plan de tratamiento personalizado', sub: 'Paso a paso, con prioridades claras.', valor: '$50.000' },
      { item: 'Presupuesto y opciones de financiación', sub: 'Sabes exactamente cuánto y cómo pagar.', valor: 'Incluido' },
      { item: 'Sin compromiso de compra', sub: 'Decides con calma, sin presión.', valor: 'Garantizado' },
    ],
    oferta: {
      titulo: 'Tu valoración, sin costo esta semana',
      lead: 'Agenda por WhatsApp y recibe una valoración completa con diagnóstico y plan de tratamiento —sin costo y sin compromiso. Así sabes qué necesitas antes de decidir.',
      valorNormal: '$190.000 COP',
      precio: 'Sin costo',
      precioSub: 'Solo agendando esta semana. Cupos limitados.',
    },
    ticker: ['Ortodoncia', 'Blanqueamiento', 'Implantes', 'Diseño de sonrisa', 'Odontopediatría', 'Endodoncia', 'Limpieza dental'],
    testimonios: [
      'Excelente atención. Me hicieron sentir tranquila en todo momento y el resultado de mi ortodoncia fue increíble.',
      'Profesionales de verdad. Me explicaron cada paso del tratamiento y los precios fueron justos. Muy recomendados.',
      'Llevé a toda mi familia. El trato con los niños es maravilloso y las instalaciones impecables.',
    ],
    faq: [
      { q: '¿Atienden urgencias?', a: 'Sí. Si tienes dolor o una emergencia, escríbenos por WhatsApp y te damos prioridad en la agenda.' },
      { q: '¿Manejan planes de pago?', a: 'Contamos con opciones de financiación y planes de pago para que tu tratamiento sea cómodo para tu bolsillo.' },
      { q: '¿La primera valoración tiene costo?', a: 'Agenda tu valoración y te explicamos sin compromiso las mejores opciones para tu caso.' },
      { q: '¿Qué medidas de bioseguridad tienen?', a: 'Seguimos todos los protocolos de esterilización y bioseguridad para que tu visita sea 100% segura.' },
    ],
    heroImg: unsplash('1588776813677-77aaf5595b83', 1100), // odontólogo en procedimiento (real, profesional)
    bannerImg: unsplash('1588776814546-1ffcf47267a5'),
    bannerQuote: 'Detrás de cada sonrisa hay un equipo que cuida cada detalle.',
    confiImg: unsplash('1606811841689-23dfddce3e95', 1100),
  },
  estetica: {
    label: 'Centro de estética',
    accent: '#A8556B', // rosa/mauve elegante
    accentDeep: '#864053',
    heroTitulo1: 'Realza tu belleza,',
    heroTitulo2: 'siéntete radiante.',
    heroLead:
      'Tratamientos faciales y corporales con resultados visibles. Un espacio pensado para que te cuides, te relajes y vuelvas a brillar.',
    manifiesto: 'Cuidarte no es un lujo, es <em>quererte</em>.',
    manifiestoSub:
      'Combinamos tecnología estética de vanguardia con un equipo experto y un ambiente que te invita a desconectar. Tu bienestar es el centro de todo.',
    stat3v: '10+',
    stat3l: 'Años embelleciendo',
    servicios: [
      { nombre: 'Limpieza facial profunda', desc: 'Piel renovada, luminosa y libre de impurezas.' },
      { nombre: 'Tratamientos corporales', desc: 'Reducción, reafirmación y modelado con tecnología avanzada.' },
      { nombre: 'Depilación láser', desc: 'Piel suave de forma duradera, sesión a sesión.' },
      { nombre: 'Rejuvenecimiento facial', desc: 'Tratamientos antiedad para una piel firme y radiante.' },
      { nombre: 'Masajes y relajación', desc: 'Desconecta del estrés y recarga tu energía.' },
    ],
    diferenciadores: [
      { icon: ICON.spark, nombre: 'Tecnología avanzada', desc: 'Equipos de última generación para resultados visibles, seguros y duraderos en cada tratamiento.' },
      { icon: ICON.heart, nombre: 'Experiencia a tu medida', desc: 'Valoramos tu piel y tus objetivos para diseñar un plan personalizado, sin tratamientos innecesarios.' },
      { icon: ICON.wallet, nombre: 'Paquetes y planes', desc: 'Opciones y promociones pensadas para que cuidarte sea constante y cómodo para tu bolsillo.' },
    ],
    valueStack: [
      { item: 'Valoración de piel personalizada', sub: 'Analizamos tu piel y tus objetivos.', valor: '$70.000' },
      { item: 'Diagnóstico con especialista', sub: 'Te decimos qué necesitas de verdad.', valor: '$50.000' },
      { item: 'Plan de tratamiento a tu medida', sub: 'Sin tratamientos innecesarios.', valor: '$40.000' },
      { item: 'Asesoría de paquetes y precios', sub: 'Claridad total, sin sorpresas.', valor: 'Incluido' },
      { item: 'Sin compromiso de compra', sub: 'Decides con tranquilidad.', valor: 'Garantizado' },
    ],
    oferta: {
      titulo: 'Tu valoración de cortesía esta semana',
      lead: 'Agenda por WhatsApp y recibe una valoración de piel con diagnóstico y plan personalizado —sin costo y sin compromiso. Empieza a cuidarte sabiendo exactamente qué necesitas.',
      valorNormal: '$160.000 COP',
      precio: 'Sin costo',
      precioSub: 'Solo agendando esta semana. Cupos limitados.',
    },
    ticker: ['Limpieza facial', 'Depilación láser', 'Tratamientos corporales', 'Rejuvenecimiento', 'Masajes', 'Radiofrecuencia', 'Hidratación'],
    testimonios: [
      'Mi piel cambió por completo. El trato es divino y siempre salgo sintiéndome renovada. Mil gracias.',
      'El mejor centro de estética de la ciudad. Profesionales, limpios y con resultados que se notan de verdad.',
      'Me encanta venir. Es mi momento de cuidarme y siempre me reciben con la mejor energía.',
    ],
    faq: [
      { q: '¿Cómo sé qué tratamiento necesito?', a: 'Agenda una valoración: analizamos tu piel o tu caso y te recomendamos el tratamiento ideal para ti.' },
      { q: '¿Los tratamientos son dolorosos?', a: 'La mayoría son indoloros y muy relajantes. Te explicamos cada paso para que estés tranquila.' },
      { q: '¿Manejan paquetes o promociones?', a: 'Sí, contamos con paquetes y planes para que cuidarte sea cómodo. Escríbenos y te contamos las promos del mes.' },
      { q: '¿Cuántas sesiones necesito?', a: 'Depende de cada tratamiento y de tu objetivo. En la valoración te damos un plan claro y realista.' },
    ],
    heroImg: unsplash('1616394584738-fc6e612e71b9', 1100), // tratamiento facial (real, profesional)
    bannerImg: unsplash('1570172619644-dfd03ed5d881'),
    bannerQuote: 'Un espacio pensado para que te cuides, te relajes y vuelvas a brillar.',
    confiImg: unsplash('1540555700478-4be289fbecef', 1100),
  },
};

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Nombre de marca corto y limpio para el nav/footer. Los nombres de Google Maps
 * suelen venir "rellenos de keywords" ("Clínica X | Odontólogo en Cali | Implantes…");
 * cortamos en el primer separador y limitamos el largo para que el header no se
 * envuelva en varias líneas. El nombre COMPLETO se sigue usando en title/H1/SEO.
 */
export function nombreMarca(nombre: string): string {
  let s = nombre.split(/[|—–·]/)[0].trim();      // antes del primer separador
  if (s.length > 32) s = s.split(',')[0].trim();  // si sigue largo, antes de la primera coma
  if (s.length > 34) s = s.slice(0, 32).trim() + '…';
  return s || nombre;
}

/** Limpia un teléfono a dígitos y arma un link wa.me con prefijo Colombia (57). */
export function waLink(telefono: string | null, mensaje?: string): string {
  if (!telefono) return '#';
  let digits = telefono.replace(/\D/g, '');
  if (digits.length === 10) digits = '57' + digits; // celular CO sin prefijo
  const base = `https://wa.me/${digits}`;
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
}

export function estrellas(rating: number | null): string {
  const r = Math.round(rating ?? 5);
  return '★★★★★'.slice(0, r) + '☆☆☆☆☆'.slice(0, 5 - r);
}

/** Link de "Cómo llegar" (direcciones) en Google Maps. Prefiere la dirección de texto. */
function direccionesUrl(direccion: string | null, mapsUrl: string | null): string {
  if (direccion) return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(direccion)}`;
  return mapsUrl || '#';
}

/** URL de mapa embebido (iframe) SIN API key — usa el embed clásico de Google Maps. */
function mapaEmbedUrl(direccion: string | null, nombre: string): string {
  const q = encodeURIComponent(direccion ? `${nombre}, ${direccion}` : nombre);
  return `https://maps.google.com/maps?q=${q}&z=15&output=embed`;
}

/** Normaliza un handle/URL de red social a URL absoluta. Devuelve '' si está vacío. */
export function redUrl(plataforma: 'instagram' | 'facebook', valor: string | null): string {
  if (!valor) return '';
  const v = valor.trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, '').replace(/\/+$/, '');
  return plataforma === 'instagram'
    ? `https://instagram.com/${handle}`
    : `https://facebook.com/${handle}`;
}

export function sitioUrl(valor: string | null): string {
  if (!valor) return '';
  const v = valor.trim();
  if (!v) return '';
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

const SOCIAL_ICON = {
  instagram: 'M12 2.2c3.2 0 3.6 0 4.9.07 1.2.05 1.8.25 2.2.42.6.2 1 .5 1.4 1 .5.4.8.8 1 1.4.2.4.4 1 .4 2.2.07 1.3.07 1.7.07 4.9s0 3.6-.07 4.9c-.05 1.2-.25 1.8-.42 2.2-.2.6-.5 1-1 1.4-.4.5-.8.8-1.4 1-.4.2-1 .4-2.2.4-1.3.07-1.7.07-4.9.07s-3.6 0-4.9-.07c-1.2-.05-1.8-.25-2.2-.42-.6-.2-1-.5-1.4-1-.5-.4-.8-.8-1-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9c.05-1.2.25-1.8.42-2.2.2-.6.5-1 1-1.4.4-.5.8-.8 1.4-1 .4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zM12 6.8a5.2 5.2 0 1 0 0 10.4 5.2 5.2 0 0 0 0-10.4zm0 8.6a3.4 3.4 0 1 1 0-6.8 3.4 3.4 0 0 1 0 6.8zm5.4-8.8a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z',
  facebook: 'M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z',
  web: 'M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z',
};

function serviciosHtml(servicios: Servicio[]): string {
  const arrow =
    '<span class="si-arrow"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>';
  return servicios
    .map(
      (s, i) => `
        <div class="serv-item">
          <span class="si-idx">${String(i + 1).padStart(2, '0')}</span>
          <div><div class="si-name">${escapeHtml(s.nombre)}</div><div class="si-desc">${escapeHtml(s.desc)}</div></div>
          ${arrow}
        </div>`
    )
    .join('');
}

function diferenciadoresHtml(items: Diferenciador[]): string {
  return items
    .map(
      (d) => `
        <div class="why reveal">
          <span class="wic"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${d.icon}"/></svg></span>
          <h3>${escapeHtml(d.nombre)}</h3>
          <p>${escapeHtml(d.desc)}</p>
        </div>`
    )
    .join('');
}

function tickerHtml(items: string[]): string {
  return items
    .map((t) => `<span class="tick-item">${escapeHtml(t)} <span class="sep">·</span></span>`)
    .join('');
}

function faqHtml(faq: { q: string; a: string }[]): string {
  const plus =
    '<span class="pm"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg></span>';
  return faq
    .map(
      (f) => `
        <details>
          <summary>${escapeHtml(f.q)} ${plus}</summary>
          <div class="ans"><p>${escapeHtml(f.a)}</p></div>
        </details>`
    )
    .join('');
}

function valueStackHtml(items: ValueItem[]): string {
  const ck =
    '<span class="ck"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>';
  return items
    .map((v) => {
      const valor = v.valor.startsWith('$') ? `<s>${escapeHtml(v.valor)}</s>` : escapeHtml(v.valor);
      return `
        <div class="stack-row">
          ${ck}
          <span class="it">${escapeHtml(v.item)}<small>${escapeHtml(v.sub)}</small></span>
          <span class="vv">${valor}</span>
        </div>`;
    })
    .join('');
}

/** Bloque de íconos de redes/web. Devuelve '' si no hay ninguna (no ensucia el diseño). */
function socialLinksHtml(igUrl: string, fbUrl: string, webUrl: string): string {
  const items: { url: string; icon: string; label: string }[] = [];
  if (igUrl) items.push({ url: igUrl, icon: SOCIAL_ICON.instagram, label: 'Instagram' });
  if (fbUrl) items.push({ url: fbUrl, icon: SOCIAL_ICON.facebook, label: 'Facebook' });
  if (webUrl) items.push({ url: webUrl, icon: SOCIAL_ICON.web, label: 'Sitio web' });
  if (!items.length) return '';
  const links = items
    .map(
      (s) =>
        `<a href="${s.url}" target="_blank" rel="noopener" class="soc" aria-label="${s.label}"><svg width="20" height="20" viewBox="0 0 24 24" fill="${s.label === 'Sitio web' ? 'none' : 'currentColor'}" stroke="${s.label === 'Sitio web' ? 'currentColor' : 'none'}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${s.icon}"/></svg></a>`
    )
    .join('');
  return `<div class="socials">${links}</div>`;
}

/** Adivina la ciudad desde la dirección (penúltimo segmento útil) o usa un default. */
export function ciudadDeDireccion(direccion: string | null): string {
  if (!direccion) return 'tu ciudad';
  const parts = direccion.split(',').map((p) => p.trim()).filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 2] : parts[0] || 'tu ciudad';
}

/** Extrae la zona/barrio (segmento intermedio) de la dirección, si existe. */
export function zonaDeDireccion(direccion: string | null): string | null {
  if (!direccion) return null;
  const parts = direccion.split(',').map((p) => p.trim()).filter(Boolean);
  // [0]=calle/número, [1]=barrio/zona, [2]=ciudad, [3]=departamento
  return parts.length >= 3 ? parts[1] : null;
}

/** Detecta la especialidad desde el nombre del negocio para personalizar el hero. */
export function focoOdonto(nombre: string): { titulo1: string; titulo2: string } | null {
  const n = nombre.toLowerCase();
  if (/ortodonc|bracket|aline|invisalign/.test(n)) return { titulo1: 'Alinea tu sonrisa,', titulo2: 'sin que se note.' };
  if (/implant/.test(n)) return { titulo1: 'Recupera tus dientes,', titulo2: 'recupera tu confianza.' };
  if (/est[eé]tic|dise[nñ]o|carilla|blanqueam/.test(n)) return { titulo1: 'Diseñamos la sonrisa', titulo2: 'que siempre quisiste.' };
  if (/infantil|ni[nñ]o|pediatr|kids/.test(n)) return { titulo1: 'Sonrisas sanas,', titulo2: 'desde pequeños.' };
  return null;
}

export interface GenerateResult {
  leadId: number;
  relUrl: string; // /demos/{id}/
  filePath: string;
}

/**
 * Genera el demo HTML para un lead. Devuelve la ruta relativa servible.
 */
export function generateDemo(lead: Lead): GenerateResult {
  const categoria: Categoria = lead.categoria === 'estetica' ? 'estetica' : 'odontologo';
  const perfil = PERFILES[categoria];
  const ciudad = ciudadDeDireccion(lead.direccion);
  const zona = zonaDeDireccion(lead.direccion);
  const ubicacion = zona ? `${zona}, ${ciudad}` : ciudad;
  const anio = new Date().getFullYear();
  const resenasNum = lead.resenas ?? 0;
  const ratingTxt = (lead.rating ?? 5).toString().replace('.', ',');

  // Personalización del hero según la especialidad detectada en el nombre.
  const foco = categoria === 'odontologo' ? focoOdonto(lead.nombre) : null;
  const heroT1 = foco?.titulo1 ?? perfil.heroTitulo1;
  const heroT2 = foco?.titulo2 ?? perfil.heroTitulo2;

  // Prueba social con datos REALES de Google (si existen).
  const noun = categoria === 'odontologo' ? 'pacientes' : 'personas';
  const socialProof =
    resenasNum > 0
      ? ` Más de ${resenasNum.toLocaleString('es-CO')} ${noun} nos califican con ${ratingTxt}★ en Google.`
      : '';
  const heroLead = perfil.heroLead + socialProof;

  const mensajeWa = `Hola, vi su página y me gustaría agendar una cita en ${lead.nombre}.`;
  const wa = waLink(lead.telefono, mensajeWa);

  // Ubicación / cómo llegar (datos reales de Google).
  const dirUrl = direccionesUrl(lead.direccion, lead.maps_url);
  const embedUrl = mapaEmbedUrl(lead.direccion, lead.nombre);

  // Redes sociales y sitio web (opcionales; el freelancer los completa si los conoce).
  const igUrl = redUrl('instagram', lead.instagram);
  const fbUrl = redUrl('facebook', lead.facebook);
  const webUrl = sitioUrl(lead.sitio_web);
  const socialsHtml = socialLinksHtml(igUrl, fbUrl, webUrl);

  // Clic-para-llamar (tel:) con prefijo Colombia.
  let telDigits = (lead.telefono || '').replace(/\D/g, '');
  if (telDigits.length === 10) telDigits = '57' + telDigits;
  const telHref = telDigits ? `tel:+${telDigits}` : '#';

  // Favicon generado (inicial + color de la marca) como data URI, sin archivo externo.
  const inicial = (lead.nombre.trim()[0] || 'V').toUpperCase();
  const faviconSvg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
    `<rect width="64" height="64" rx="14" fill="${perfil.accent}"/>` +
    `<text x="50%" y="50%" dy="2" font-family="Georgia,serif" font-size="38" font-weight="700" fill="#FAF6EF" text-anchor="middle" dominant-baseline="central">${escapeHtml(inicial)}</text>` +
    `</svg>`;
  const faviconHref = `data:image/svg+xml,${encodeURIComponent(faviconSvg)}`;

  // Datos estructurados (JSON-LD) para Google, con datos REALES.
  const schemaType = categoria === 'estetica' ? 'BeautySalon' : 'Dentist';
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: lead.nombre,
    image: perfil.heroImg,
    description: heroLead.replace(/<[^>]+>/g, ''),
    telephone: telDigits ? `+${telDigits}` : undefined,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: lead.direccion || undefined,
      addressLocality: ciudad,
      addressCountry: 'CO',
    },
    openingHours: 'Mo-Sa 08:00-18:00',
    url: webUrl || lead.maps_url || undefined,
    sameAs: [igUrl, fbUrl, webUrl, lead.maps_url].filter(Boolean),
  };
  if (resenasNum > 0) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: lead.rating ?? 5,
      reviewCount: resenasNum,
      bestRating: 5,
    };
  }
  // Stringify seguro: escapa "<" para no romper el </script> contenedor.
  const jsonLdStr = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

  // Enlace a las opiniones reales de Google (si hay ficha de Maps).
  const reviewsUrl = lead.maps_url || '#';
  const reviewsLine =
    resenasNum > 0
      ? `Calificación real de ${ratingTxt}★ con ${resenasNum.toLocaleString('es-CO')} opiniones verificadas en Google.`
      : 'Opiniones verificadas por pacientes reales en Google.';

  // Meta social (og/twitter) + canonical → preview rico al compartir el link por WhatsApp/redes.
  // La imagen de preview es la del hero (URL absoluta de Unsplash). canonical/og:url solo si hay
  // hosting público configurado (si no, se omiten para no apuntar a una URL vacía).
  const publicBase = process.env.DEMOS_PUBLIC_BASE;
  const canonical = publicBase ? `${publicBase.replace(/\/$/, '')}/${lead.id}/` : '';
  // srcset del hero (extraemos el id de la URL del perfil) → el móvil baja una imagen liviana.
  const heroId = (perfil.heroImg.match(/photo-([^?]+)/) || [])[1] || '';
  const heroSrcset = heroId ? unsplashSrcset(heroId) : '';
  // Igual para la foto de la sección Confianza (debajo del pliegue, lazy): srcset = menos datos en móvil.
  const confiId = (perfil.confiImg.match(/photo-([^?]+)/) || [])[1] || '';
  const confiSrcset = confiId ? unsplashSrcset(confiId) : '';
  // Imagen social dedicada en proporción 1200×630 (estándar OG), recorte centrado en rostros:
  // así el preview de WhatsApp/redes se ve bien y no recorta raro la foto vertical del hero.
  const ogImage = heroId
    ? `https://images.unsplash.com/photo-${heroId}?w=1200&h=630&fit=crop&crop=faces,center&q=80&auto=format`
    : perfil.heroImg;
  const heroLeadPlain = heroLead.replace(/<[^>]+>/g, '');
  const tituloSocial = `${lead.nombre} — ${perfil.label}`;
  const socialMeta = [
    `<meta property="og:type" content="business.business" />`,
    `<meta property="og:locale" content="es_CO" />`,
    `<meta property="og:site_name" content="${escapeHtml(lead.nombre)}" />`,
    `<meta property="og:title" content="${escapeHtml(tituloSocial)}" />`,
    `<meta property="og:description" content="${escapeHtml(heroLeadPlain)}" />`,
    `<meta property="og:image" content="${escapeHtml(ogImage)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${escapeHtml(`${lead.nombre} — ${perfil.label} en ${ciudad}`)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(tituloSocial)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(heroLeadPlain)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />`,
    ...(canonical
      ? [`<meta property="og:url" content="${canonical}" />`, `<link rel="canonical" href="${canonical}" />`]
      : []),
  ].join('\n  ');

  const replacements: Record<string, string> = {
    SOCIAL_META: socialMeta,
    NOMBRE_CORTO: escapeHtml(nombreMarca(lead.nombre)),
    HERO_SRCSET: heroSrcset,
    CONFIANZA_SRCSET: confiSrcset,
    NOMBRE: escapeHtml(lead.nombre),
    CAT_LABEL: perfil.label,
    CIUDAD: escapeHtml(ciudad),
    UBICACION: escapeHtml(ubicacion),
    DIRECCION: escapeHtml(lead.direccion || 'Consulta nuestra ubicación'),
    TELEFONO: escapeHtml(lead.telefono || ''),
    WA_LINK: wa,
    MAPS_URL: lead.maps_url || '#',
    DIRECCIONES_URL: dirUrl,
    MAPA_EMBED_URL: embedUrl,
    TEL_HREF: telHref,
    FAVICON_HREF: faviconHref,
    JSONLD: jsonLdStr,
    REVIEWS_URL: reviewsUrl,
    REVIEWS_LINE: escapeHtml(reviewsLine),
    SOCIALS_HTML: socialsHtml,
    RATING: ratingTxt,
    RESENAS: resenasNum.toLocaleString('es-CO'),
    RESENAS_NUM: String(resenasNum),
    ESTRELLAS: estrellas(lead.rating),
    ANIO: String(anio),
    ACENTO: perfil.accent,
    ACENTO_DEEP: perfil.accentDeep,
    HERO_TITULO_1: escapeHtml(heroT1),
    HERO_TITULO_2: escapeHtml(heroT2),
    HERO_LEAD: escapeHtml(heroLead),
    HERO_LEAD_PLAIN: heroLeadPlain,
    HERO_IMG: perfil.heroImg,
    MANIFIESTO: perfil.manifiesto,
    MANIFIESTO_SUB: perfil.manifiestoSub,
    STAT_3_V: perfil.stat3v,
    STAT_3_L: perfil.stat3l,
    SERVICIOS_HTML: serviciosHtml(perfil.servicios),
    DIFERENCIADORES_HTML: diferenciadoresHtml(perfil.diferenciadores),
    VALUE_STACK_HTML: valueStackHtml(perfil.valueStack),
    OFERTA_TITULO: escapeHtml(perfil.oferta.titulo),
    OFERTA_LEAD: escapeHtml(perfil.oferta.lead),
    OFERTA_VALOR_NORMAL: escapeHtml(perfil.oferta.valorNormal),
    OFERTA_PRECIO: escapeHtml(perfil.oferta.precio),
    OFERTA_PRECIO_SUB: escapeHtml(perfil.oferta.precioSub),
    BANNER_IMG: perfil.bannerImg,
    BANNER_QUOTE: escapeHtml(perfil.bannerQuote),
    CONFIANZA_IMG: perfil.confiImg,
    TICKER_HTML: tickerHtml(perfil.ticker),
    TESTIMONIO_1: escapeHtml(perfil.testimonios[0]),
    TESTIMONIO_2: escapeHtml(perfil.testimonios[1]),
    TESTIMONIO_3: escapeHtml(perfil.testimonios[2]),
    FAQ_HTML: faqHtml(perfil.faq),
    VERA_BRAND: escapeHtml(VERA_BRAND),
  };

  let html = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
  for (const [key, value] of Object.entries(replacements)) {
    html = html.replaceAll(`{{${key}}}`, value);
  }

  const outDir = path.join(DEMOS_DIR, String(lead.id));
  fs.mkdirSync(outDir, { recursive: true });
  const filePath = path.join(outDir, 'index.html');
  fs.writeFileSync(filePath, html, 'utf-8');

  // Apunta a index.html: Next sirve /public sin resolver índices de carpeta.
  // (En GitHub Pages la URL /{id}/ sí resuelve el índice.)
  return { leadId: lead.id, relUrl: `/demos/${lead.id}/index.html`, filePath };
}
