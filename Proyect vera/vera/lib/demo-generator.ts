import fs from 'node:fs';
import path from 'node:path';
import type { Lead, Categoria } from './db';

/**
 * Generador de demos SIN IA: lee templates/base/index.html y reemplaza los
 * {{placeholders}} con los datos del negocio + el contenido del perfil de su
 * categoría. Escribe el resultado en public/demos/{id}/index.html.
 *
 * El template es la landing "monocromo" (negro/blanco, Open Sauce One, masked
 * cards). Aquí solo definimos el CONTENIDO por vertical (odontólogo / estética)
 * y mapeamos los datos reales scrapeados de Google Maps.
 */

const TEMPLATE_PATH = path.join(process.cwd(), 'templates', 'base', 'index.html');
const DEMOS_DIR = path.join(process.cwd(), 'public', 'demos');

const VERA_BRAND = process.env.NEXT_PUBLIC_VERA_BRAND || 'Vera';

/**
 * URL del pixel de seguimiento de apertura para un lead. Usa la URL pública de
 * la app (`VERA_PUBLIC_URL`, p.ej. el túnel del webhook). Devuelve '' si no hay
 * base pública o el id es inválido → el generador no inyecta pixel.
 */
export function trackPixelUrl(leadId: number, base?: string | null): string {
  const b = (base ?? process.env.VERA_PUBLIC_URL ?? '').replace(/\/+$/, '');
  if (!b || !Number.isInteger(leadId) || leadId <= 0) return '';
  return `${b}/api/track?lead=${leadId}`;
}

/* ------------------------------------------------------------------ */
/* TIPOS DEL PERFIL                                                    */
/* ------------------------------------------------------------------ */

interface FeatureBar { label: string }
interface Servicio { icon: string; nombre: string; desc: string; precio: string; pts: string[] }
interface MiniServicio { nombre: string; num: string | null; active: boolean }
interface Why { icon: string; titulo: string; desc: string }
interface Paso { num: string; titulo: string; desc: string }
interface Miembro { iniciales: string; nombre: string; rol: string; anios: string; bio: string }
interface Tech { titulo: string; desc: string }
interface Testimonio { nombre: string; lugar: string; texto: string }
interface Plan { nombre: string; precio: string; periodo: string; desc: string; feat: boolean; features: string[] }
interface FaqItem { q: string; a: string }

interface CatProfile {
  label: string;
  logoSub: string;
  featureBars: FeatureBar[];
  heroTop: string;
  heroPreNoun: string;     // "dentista" | "centro de estética"
  heroH1_1: string;
  heroH1_2: string;
  heroBr: string;
  statsExtra: { v: string; suf: string; l: string }[]; // los 2 stats no-Google
  galTitulo: string;
  galSub: string;
  galPromo: string;
  galCall: string;
  galBig1: string;
  galBig2: string;
  miniServicios: MiniServicio[];
  serviciosTitulo: string;
  serviciosSub: string;
  servicios: Servicio[];
  whyTitulo: string;
  whySub: string;
  why: Why[];
  procTitulo: string;
  procSub: string;
  pasos: Paso[];
  s3Titulo1: string;
  s3Titulo2: string;
  s3Sub: string;
  s3ConsultLabel: string;
  s3ConsultTitulo: string;
  s3Ov1: string;
  s3Ov2: string;
  teamTitulo: string;
  teamSub: string;
  equipo: Miembro[];
  techTitulo: string;
  techSub: string;
  tecnologias: Tech[];
  tstTituloBase: string;
  tstSub: string;
  testimonios: Testimonio[];
  pricingTitulo: string;
  pricingSub: string;
  planes: Plan[];
  mediosPago: string[];
  faq: FaqItem[];
  ctaH1: string;
  ctaH2: string;
  ctaSub: string;
  contactFoco: string;     // "sonrisa" | "piel"
  servOptions: string[];
  footerDesc: string;
  footerServLinks: string[];
  /** Carpeta de assets locales (p.ej. '_assets/odontologia') o null si usa URLs (Unsplash). */
  assetDir: string | null;
  /** Extensión de los assets locales ('webp' | 'jpg'). */
  assetExt: string;
  heroImg: string;
  galleryImg: string;
  s3Img1: string;
  s3Img2: string;
  s3Bg: string;
}

/* ------------------------------------------------------------------ */
/* HELPERS DE IMAGEN / TEXTO (infra existente, conservada)            */
/* ------------------------------------------------------------------ */

export function unsplash(id: string, w = 1600): string {
  return `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;
}
export function unsplashSrcset(id: string, widths = [480, 768, 1100, 1600]): string {
  return widths.map((w) => `${unsplash(id, w)} ${w}w`).join(', ');
}

// Íconos (paths SVG stroke) reutilizados en servicios / diferenciadores / tech.
const ICON = {
  diente: 'M12 2c-2 0-3 1-4.5 1S5 2 4 3.5 3 8 4 12s1.5 8 2.5 8 1.5-3 2-5 1-2 1.5-2 1 0 1.5 2 1 5 2 5 2-4 2.5-8 1.5-7 0-8.5S15 3 13.5 3 14 2 12 2z',
  corona: 'M3 8l4 4 5-7 5 7 4-4-2 11H5L3 8Z',
  brillo: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18',
  implante: 'M12 2c-2.5 0-4 2-4 4 0 1.5.5 2.5 1 3.5L8 22M16 22l-1-12.5c.5-1 1-2 1-3.5 0-2-1.5-4-4-4ZM9 14h6',
  alinear: 'M4 9c0-2 2-3 8-3s8 1 8 3-1 4-2 6c-.8 1.6-2 3-4 3-1.2 0-1.5-1-2-1s-.8 1-2 1c-2 0-3.2-1.4-4-3-1-2-2-4-2-6Z',
  endodoncia: 'M9 3h6M12 3v4M9 7c-2 0-3 2-3 5 0 4 1.5 9 3 9 .8 0 1-1.5 1-3M15 7c2 0 3 2 3 5 0 4-1.5 9-3 9-.8 0-1-1.5-1-3',
  nino: 'M5 21c0-4 3-6 7-6s7 2 7 6M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
  urgencia: 'M12 21s-7-4.5-7-10a7 7 0 0 1 14 0c0 5.5-7 10-7 10ZM12 7v5M9.5 9.5h5',
  facial: 'M12 3a7 7 0 0 0-7 7c0 4 3 9 7 11 4-2 7-7 7-11a7 7 0 0 0-7-7ZM9 10h.01M15 10h.01M9.5 14c.7.7 1.5 1 2.5 1s1.8-.3 2.5-1',
  corporal: 'M12 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM6 22c0-4 2-8 6-8s6 4 6 8M9 14l-2 8M15 14l2 8',
  laser: 'M12 2v6M12 22v-4M4 12H2M22 12h-2M7 7 5 5M19 5l-2 2M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  masaje: 'M3 13c2-2 5-3 9-3s7 1 9 3M5 17c2-1.5 4-2 7-2s5 .5 7 2M8 9c1-1 2.5-1.5 4-1.5S15 8 16 9',
  radio: 'M12 12a3 3 0 1 0 0-.001M4 12a8 8 0 0 1 16 0M7 12a5 5 0 0 1 10 0',
  hidrata: 'M12 3s6 6 6 10a6 6 0 0 1-12 0c0-4 6-10 6-10Z',
  corazon: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z',
  escudo: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3ZM9 12l2 2 4-4',
  reloj: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  billetera: 'M3 7h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zM3 7l2-3h11l2 3M16 13h.01',
  premio: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12ZM9 14l-2 7 5-3 5 3-2-7',
  agenda: 'M3 5h18v16H3zM3 9h18M8 3v4M16 3v4M9 14l2 2 4-4',
  monitor: 'M3 4h18v13H3zM8 21h8M12 17v4M7 9l2 2 2-3 2 4 2-2',
  escaner: 'M3 7V4h3M21 7V4h-3M3 17v3h3M21 17v3h-3M7 12h10',
};

const SOCIAL_ICON = {
  instagram: 'M12 2.2c3.2 0 3.6 0 4.9.07 1.2.05 1.8.25 2.2.42.6.2 1 .5 1.4 1 .5.4.8.8 1 1.4.2.4.4 1 .4 2.2.07 1.3.07 1.7.07 4.9s0 3.6-.07 4.9c-.05 1.2-.25 1.8-.42 2.2-.2.6-.5 1-1 1.4-.4.5-.8.8-1.4 1-.4.2-1 .4-2.2.4-1.3.07-1.7.07-4.9.07s-3.6 0-4.9-.07c-1.2-.05-1.8-.25-2.2-.42-.6-.2-1-.5-1.4-1-.5-.4-.8-.8-1-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9c.05-1.2.25-1.8.42-2.2.2-.6.5-1 1-1.4.4-.5.8-.8 1.4-1 .4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zM12 6.8a5.2 5.2 0 1 0 0 10.4 5.2 5.2 0 0 0 0-10.4zm0 8.6a3.4 3.4 0 1 1 0-6.8 3.4 3.4 0 0 1 0 6.8zm5.4-8.8a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z',
  facebook: 'M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z',
  web: 'M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z',
};

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function nombreMarca(nombre: string): string {
  let s = nombre.split(/[|—–·]/)[0].trim();
  if (s.length > 32) s = s.split(',')[0].trim();
  if (s.length > 34) s = s.slice(0, 32).trim() + '…';
  return s || nombre;
}

/** Parte el nombre corto en 2 líneas para el logo apilado del diseño. */
function logoLines(nombreCorto: string): { l1: string; l2: string } {
  const words = nombreCorto.split(/\s+/).filter(Boolean);
  if (words.length === 1) return { l1: words[0], l2: '' };
  if (words.length === 2) return { l1: words[0], l2: words[1] };
  const mid = Math.ceil(words.length / 2);
  return { l1: words.slice(0, mid).join(' '), l2: words.slice(mid).join(' ') };
}

export function waLink(telefono: string | null, mensaje?: string): string {
  if (!telefono) return '#';
  let digits = telefono.replace(/\D/g, '');
  if (digits.length === 10) digits = '57' + digits;
  const base = `https://wa.me/${digits}`;
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
}
function waBase(telefono: string | null): string {
  if (!telefono) return 'https://wa.me/';
  let digits = telefono.replace(/\D/g, '');
  if (digits.length === 10) digits = '57' + digits;
  return `https://wa.me/${digits}`;
}

export function estrellas(rating: number | null): string {
  const r = Math.round(rating ?? 5);
  return '★★★★★'.slice(0, r) + '☆☆☆☆☆'.slice(0, 5 - r);
}

/** 5 estrellas SVG (filled = n). */
function starsSvg(n = 5): string {
  let out = '';
  for (let i = 0; i < 5; i++) {
    const fill = i < n ? 'currentColor' : 'none';
    out += `<svg width="16" height="16" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="1.5"><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9L12 3Z"/></svg>`;
  }
  return out;
}

function direccionesUrl(direccion: string | null, mapsUrl: string | null): string {
  if (direccion) return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(direccion)}`;
  return mapsUrl || '#';
}
/**
 * URL de mapa embebido de Google Maps centrado en la ubicación del negocio.
 * Usa el embed clásico (`output=embed`), que funciona sin API key ni costo.
 * Antepone el nombre (si se da) para un pin más preciso. Devuelve '' si no hay
 * dirección → el generador no inyecta mapa.
 */
export function mapaEmbedUrl(direccion?: string | null, nombre?: string | null): string {
  const dir = (direccion || '').trim();
  if (!dir) return '';
  const n = (nombre || '').trim();
  const q = n ? `${n}, ${dir}` : dir;
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`;
}

export function redUrl(plataforma: 'instagram' | 'facebook', valor: string | null): string {
  if (!valor) return '';
  const v = valor.trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, '').replace(/\/+$/, '');
  return plataforma === 'instagram' ? `https://instagram.com/${handle}` : `https://facebook.com/${handle}`;
}
export function sitioUrl(valor: string | null): string {
  if (!valor) return '';
  const v = valor.trim();
  if (!v) return '';
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

export function ciudadDeDireccion(direccion: string | null): string {
  if (!direccion) return 'tu ciudad';
  const parts = direccion.split(',').map((p) => p.trim()).filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 2] : parts[0] || 'tu ciudad';
}
export function zonaDeDireccion(direccion: string | null): string | null {
  if (!direccion) return null;
  const parts = direccion.split(',').map((p) => p.trim()).filter(Boolean);
  return parts.length >= 3 ? parts[1] : null;
}

/* ------------------------------------------------------------------ */
/* IMÁGENES POR VERTICAL (Unsplash, hotlink permitido)                */
/* ------------------------------------------------------------------ */

const IMG = {
  odontologo: {
    hero: '1588776813677-77aaf5595b83',
    gallery: '1588776814546-1ffcf47267a5',
    s3bg: '1606811841689-23dfddce3e95',
    s3a: '1629909613654-28e377c37b09',
    s3b: '1609840114035-3c981b782dfe',
  },
  estetica: {
    hero: '1616394584738-fc6e612e71b9',
    gallery: '1570172619644-dfd03ed5d881',
    s3bg: '1540555700478-4be289fbecef',
    s3a: '1512290923902-8a9f81dc236c',
    s3b: '1487412947147-5cebf100ffc2',
  },
};

/* ------------------------------------------------------------------ */
/* PERFILES                                                            */
/* ------------------------------------------------------------------ */

const PERFILES: Record<Categoria, CatProfile> = {
  odontologo: {
    label: 'Clínica odontológica',
    logoSub: 'salud de calidad',
    featureBars: [{ label: 'Odontología Avanzada' }, { label: 'Equipos de Alta Calidad' }, { label: 'Personal Amable' }],
    heroTop: 'Deseamos ofrecer servicios dentales profesionales que estén a la altura de las tecnologías actuales.',
    heroPreNoun: 'dentista',
    heroH1_1: 'Cuidado',
    heroH1_2: 'Dental',
    heroBr: 'Consulta Gratis',
    statsExtra: [{ v: '22', suf: '+', l: 'Años de Experiencia' }, { v: '14', suf: '', l: 'Especialistas Expertos' }],
    galTitulo: 'Galería de Sonrisas',
    galSub: 'Nuestro trabajo de estética dental',
    galPromo: 'Si quieres una sonrisa preciosa, escríbenos y pregunta por un diseño de sonrisa.',
    galCall: 'Escríbenos',
    galBig1: 'Diseño',
    galBig2: 'de sonrisa',
    miniServicios: [
      { nombre: 'Carillas\nDentales', num: '01', active: true },
      { nombre: 'Coronas\nDentales', num: '02', active: false },
      { nombre: 'Blanquea-\nmiento', num: '03', active: false },
      { nombre: 'Implantes\nDentales', num: null, active: false },
    ],
    serviciosTitulo: 'Cuidado completo para cada sonrisa',
    serviciosSub: 'Desde limpiezas de rutina hasta diseños de sonrisa completos, nuestros especialistas ofrecen odontología de clase mundial bajo un mismo techo.',
    servicios: [
      { icon: ICON.diente, nombre: 'Carillas de Porcelana', desc: 'Láminas ultradelgadas hechas a medida que transforman la forma, el color y la alineación de tus dientes en apenas dos visitas.', precio: 'desde $850.000', pts: ['Porcelana antimanchas', 'Translucidez natural', 'Mínimo desgaste del esmalte'] },
      { icon: ICON.corona, nombre: 'Coronas Dentales', desc: 'Coronas duraderas y del color del diente que devuelven fuerza y belleza a piezas dañadas o debilitadas.', precio: 'desde $700.000', pts: ['Opción CEREC el mismo día', 'Zirconio y E-max', 'Garantía de 10 años'] },
      { icon: ICON.brillo, nombre: 'Blanqueamiento Dental', desc: 'Blanqueamiento profesional en consultorio y para casa que aclara tu sonrisa hasta 8 tonos de forma segura.', precio: 'desde $350.000', pts: ['Tecnología Zoom!', 'Fórmula de baja sensibilidad', 'Resultados en una hora'] },
      { icon: ICON.implante, nombre: 'Implantes Dentales', desc: 'Implantes de titanio permanentes que lucen, se sienten y funcionan como dientes naturales, hechos para durar toda la vida.', precio: 'desde $2.400.000', pts: ['Colocación guiada 3D', 'Arcada completa All-on-4', 'Injerto óseo disponible'] },
      { icon: ICON.alinear, nombre: 'Ortodoncia Invisible y Brackets', desc: 'Alineadores transparentes discretos y ortodoncia moderna que enderezan tus dientes sin interrumpir tu vida.', precio: 'desde $1.800.000', pts: ['Alineadores invisibles', 'Previsualización digital del tratamiento', 'Planes de pago flexibles'] },
      { icon: ICON.endodoncia, nombre: 'Tratamiento de Conducto', desc: 'Endodoncia suave y prácticamente indolora que salva los dientes infectados y alivia el dolor rápido.', precio: 'desde $400.000', pts: ['Instrumentación rotatoria', 'Opción en una sola visita', 'Precisión con microscopio'] },
      { icon: ICON.nino, nombre: 'Odontopediatría', desc: 'Un ambiente cálido y divertido que ayuda a los niños a crear hábitos sanos y a amar al dentista de por vida.', precio: 'desde $90.000', pts: ['Equipo amigable con los niños', 'Sellantes y flúor', 'Primeras visitas suaves'] },
      { icon: ICON.urgencia, nombre: 'Atención de Urgencias', desc: 'Citas de urgencia el mismo día para dientes rotos, dolor fuerte, inflamación y trauma dental, los 7 días.', precio: '24 / 7 disponible', pts: ['Alivio el mismo día', 'Atención sin cita', 'Línea fuera de horario'] },
    ],
    whyTitulo: 'Una experiencia dental pensada para ti',
    whySub: 'Combinamos tecnología de punta con un trato genuino y humano, para que cada visita se sienta fácil.',
    why: [
      { icon: ICON.monitor, titulo: 'Tecnología Avanzada', desc: 'Tomografía 3D de haz cónico, escáneres intraorales y radiografía digital para diagnósticos precisos y con poca radiación.' },
      { icon: ICON.corazon, titulo: 'Tratamientos Sin Dolor', desc: 'Opciones de sedación, tecnología de anestesia y un trato suave mantienen cada visita tranquila y cómoda.' },
      { icon: ICON.agenda, titulo: 'Citas el Mismo Día', desc: 'Agenda flexible con cupos el mismo día y fines de semana, para que la atención se ajuste a tu vida ocupada.' },
      { icon: ICON.billetera, titulo: 'Precios Transparentes', desc: 'Presupuestos claros por adelantado, sin facturas sorpresa, y financiación sin intereses en tratamientos grandes.' },
      { icon: ICON.escudo, titulo: 'Aceptamos tu EPS', desc: 'Trabajamos con los principales medios de pago y EPS, y nos encargamos del papeleo por ti.' },
      { icon: ICON.premio, titulo: 'Equipo Premiado', desc: 'Especialistas certificados, reconocidos por su excelencia en la atención al paciente.' },
    ],
    procTitulo: 'Tu camino hacia una sonrisa más radiante',
    procSub: 'Cuatro pasos simples desde tu primer saludo hasta una sonrisa sana y segura.',
    pasos: [
      { num: '01', titulo: 'Agenda tu Consulta', desc: 'Agenda en línea en 60 segundos o escríbenos. Encontramos un horario que te sirva, muchas veces el mismo día.' },
      { num: '02', titulo: 'Plan Personalizado', desc: 'Un examen completo, escaneos digitales y un plan de tratamiento claro y por escrito, con precios transparentes.' },
      { num: '03', titulo: 'Tratamiento Cómodo', desc: 'Relájate en nuestros consultorios tipo spa mientras nuestros especialistas te atienden con suavidad y precisión.' },
      { num: '04', titulo: 'Cuidado Continuo', desc: 'Controles fáciles, recordatorios y un programa de higiene de por vida para mantener tu sonrisa radiante.' },
    ],
    s3Titulo1: 'Implantes',
    s3Titulo2: 'Dentales',
    s3Sub: 'Recupera Dientes Perdidos',
    s3ConsultLabel: 'Consulta',
    s3ConsultTitulo: 'Servicios de<br/>Restauración<br/>Dental',
    s3Ov1: 'El Proceso<br/>de Instalar<br/>Implantes',
    s3Ov2: 'Cuidado<br/>de los<br/>Implantes',
    teamTitulo: 'Los especialistas detrás de tu sonrisa',
    teamSub: 'Un equipo multidisciplinario de odontólogos certificados, cada uno líder en su área.',
    equipo: [
      { iniciales: 'EC', nombre: 'Dra. Emily Carter', rol: 'Odontología Estética, DDS', anios: '15 años', bio: 'Especialista en diseño de sonrisa formada en NYU, reconocida por carillas naturales que cambian vidas.' },
      { iniciales: 'JR', nombre: 'Dr. James Rodríguez', rol: 'Implantología, DMD', anios: '18 años', bio: 'Coloca más de 400 implantes al año con flujos quirúrgicos totalmente guiados en 3D.' },
      { iniciales: 'SC', nombre: 'Dra. Sarah Chen', rol: 'Ortodoncia, MS', anios: '12 años', bio: 'Proveedora nivel Diamante de Invisalign, creando sonrisas seguras para adolescentes y adultos.' },
      { iniciales: 'MB', nombre: 'Dr. Michael Brooks', rol: 'Endodoncia, DDS', anios: '20 años', bio: 'Experto en tratamientos de conducto con microscopio, dedicado a salvar dientes sin dolor.' },
      { iniciales: 'OM', nombre: 'Dra. Olivia Martínez', rol: 'Odontopediatría, DMD', anios: '10 años', bio: 'Convierte la primera visita en una aventura divertida y crea hábitos sanos de por vida en los niños.' },
      { iniciales: 'DK', nombre: 'Dr. David Kim', rol: 'Cirugía Oral, DDS', anios: '16 años', bio: 'Cirujano certificado especializado en extracciones, injertos y reconstrucción de arcada completa.' },
    ],
    techTitulo: 'Odontología de precisión, impulsada por la ciencia',
    techSub: 'Invertimos en los equipos más avanzados para que tu atención sea más rápida, segura y cómoda que nunca.',
    tecnologias: [
      { titulo: 'Tomografía 3D de Haz Cónico', desc: 'Imágenes 3D ultraprecisas con hasta 90% menos radiación.' },
      { titulo: 'Escáneres Intraorales', desc: 'Adiós a las impresiones incómodas: impresiones digitales rápidas.' },
      { titulo: 'Coronas CEREC el Mismo Día', desc: 'Diseñadas, fresadas y colocadas en una sola cita.' },
      { titulo: 'Láser de Tejidos Blandos', desc: 'Cicatrización más rápida y menos sangrado en encías.' },
      { titulo: 'Cirugía de Implantes Guiada', desc: 'Colocación planificada por computador para resultados predecibles.' },
      { titulo: 'Diseño Digital de Sonrisa', desc: 'Previsualiza tu nueva sonrisa antes de empezar.' },
    ],
    tstTituloBase: 'sonrisas felices',
    tstSub: 'Opiniones reales de pacientes reales.',
    testimonios: [
      { nombre: 'Jessica M.', lugar: '', texto: 'Le tuve miedo al dentista toda mi vida. Aquí eso cambió por completo. Mis carillas quedaron increíbles y todo el proceso fue sin dolor.' },
      { nombre: 'Robert T.', lugar: '', texto: 'Me hice los implantes y no podría estar más feliz. Profesionales, precios transparentes y cero dolor. Muy recomendados.' },
      { nombre: 'Amanda K.', lugar: '', texto: 'Llevé a mis dos hijos y el equipo pediátrico fue paciente y amable. ¡Mi hija incluso pregunta cuándo puede volver al dentista!' },
      { nombre: 'Daniel P.', lugar: '', texto: 'Corona el mismo día en una sola visita, entré y salí en mi hora de almuerzo. La tecnología aquí es de otro nivel.' },
      { nombre: 'Sophia L.', lugar: '', texto: 'Terminé mi tratamiento con Invisalign en 9 meses y mi sonrisa nunca se vio mejor. El equipo se sintió como familia todo el tiempo.' },
      { nombre: 'Marcus W.', lugar: '', texto: 'Se me rompió un diente un domingo y me atendieron en menos de una hora. Salvavidas. Así debería sentirse la atención dental.' },
    ],
    pricingTitulo: 'Cuidado accesible, sin necesidad de seguro',
    pricingSub: 'Olvídate de los trámites con una membresía mensual simple.',
    planes: [
      { nombre: 'Esencial', precio: '49.900', periodo: '/ mes', desc: 'Perfecto para quienes quieren mantener su cuidado de rutina al día.', feat: false, features: ['2 limpiezas al año', '2 exámenes de rutina', 'Radiografía digital anual', '15% de descuento en todos los tratamientos', 'Sin necesidad de seguro'] },
      { nombre: 'Familiar', precio: '99.900', periodo: '/ mes', desc: 'Cobertura completa para todo el hogar, hasta 4 miembros.', feat: true, features: ['Todo lo del plan Esencial', 'Hasta 4 miembros de la familia', 'Urgencias sin costo', '20% de descuento en todos los tratamientos', 'Prioridad para citas el mismo día', 'Flúor gratis para niños'] },
      { nombre: 'Premium', precio: '149.900', periodo: '/ mes', desc: 'Cuidado total con beneficios estéticos y el mayor ahorro que ofrecemos.', feat: false, features: ['Todo lo del plan Familiar', '1 blanqueamiento gratis al año', '25% de descuento en estética dental', 'Coordinador de cuidado dedicado', 'Financiación sin intereses'] },
    ],
    mediosPago: ['Nequi', 'Daviplata', 'Bancolombia', 'PSE', 'Visa', 'Mastercard', 'Addi', 'Sistecrédito'],
    faq: [
      { q: '¿Aceptan mi seguro dental o EPS?', a: 'Trabajamos con los principales medios de pago y EPS. Nuestro equipo verifica tus beneficios antes del tratamiento y se encarga del papeleo, así siempre sabes tu costo por adelantado.' },
      { q: '¿Cuánto cuesta un implante dental?', a: 'Un implante unitario inicia en $2.400.000 e incluye el implante, el pilar y la corona. Las soluciones de arcada completa como All-on-4 se cotizan tras una valoración 3D sin costo. Ofrecemos financiación sin intereses.' },
      { q: '¿Los tratamientos son dolorosos?', a: 'La comodidad del paciente es nuestra prioridad. Usamos la última tecnología de anestesia, ofrecemos sedación y técnicas suaves, así que la mayoría reporta poca o ninguna molestia, incluso en conductos y extracciones.' },
      { q: '¿Puedo conseguir una cita el mismo día?', a: 'Sí. Reservamos cupos todos los días para citas y urgencias del mismo día. Escríbenos y haremos lo posible por atenderte hoy, incluso tardes y fines de semana.' },
      { q: '¿Cuánto duran las carillas y coronas?', a: 'Con buena higiene, las carillas de porcelana duran entre 10 y 15 años, y las coronas entre 10 y 20. Respaldamos nuestras coronas con 10 años de garantía y un plan de mantenimiento personalizado.' },
      { q: '¿Ofrecen financiación o planes de pago?', a: 'Por supuesto. Ofrecemos financiación propia sin intereses, Addi, Sistecrédito y planes mensuales desde $49.900 para que recibas tu tratamiento sin estrés financiero.' },
      { q: '¿Qué hago en una urgencia dental?', a: 'Llámanos o escríbenos de inmediato. Si se te cae un diente, mantenlo húmedo (en leche o saliva) y ven en la primera hora para tener la mejor opción de salvarlo.' },
      { q: '¿Cada cuánto debo visitar al dentista?', a: 'Recomendamos una limpieza y examen cada seis meses para la mayoría. Quienes tienen enfermedad de encías, implantes u ortodoncia pueden necesitar visitas más frecuentes, que adaptamos a tu caso.' },
    ],
    ctaH1: 'Tu mejor sonrisa',
    ctaH2: 'empieza hoy',
    ctaSub: 'Agenda tu consulta gratis en menos de un minuto. Citas el mismo día disponibles.',
    contactFoco: 'sonrisa',
    servOptions: ['Chequeo general', 'Blanqueamiento dental', 'Carillas de porcelana', 'Implantes dentales', 'Invisalign / Brackets', 'Tratamiento de conducto', 'Urgencia', 'Otro'],
    footerDesc: 'Odontología de confianza desde 2003. Combinamos tecnología avanzada con un trato amable y humano para toda la familia.',
    footerServLinks: ['Carillas', 'Implantes', 'Blanqueamiento', 'Ortodoncia', 'Coronas', 'Urgencias'],
    assetDir: '_assets/odontologia',
    assetExt: 'webp',
    heroImg: '',
    galleryImg: '',
    s3Img1: '',
    s3Img2: '',
    s3Bg: '',
  },

  estetica: {
    label: 'Centro de estética',
    logoSub: 'belleza y bienestar',
    featureBars: [{ label: 'Estética Avanzada' }, { label: 'Tecnología de Punta' }, { label: 'Atención Personalizada' }],
    heroTop: 'Tratamientos faciales y corporales con resultados visibles y un trato cercano, pensados para ti.',
    heroPreNoun: 'centro de estética',
    heroH1_1: 'Belleza',
    heroH1_2: 'Real',
    heroBr: 'Valoración sin costo',
    statsExtra: [{ v: '10', suf: '+', l: 'Años embelleciendo' }, { v: '4000', suf: '+', l: 'Clientes felices' }],
    galTitulo: 'Galería de resultados',
    galSub: 'Nuestros tratamientos y resultados',
    galPromo: 'Si quieres lucir radiante, escríbenos y pregunta por tu plan de tratamiento personalizado.',
    galCall: 'Escríbenos',
    galBig1: 'Tu mejor',
    galBig2: 'versión',
    miniServicios: [
      { nombre: 'Limpieza\nFacial', num: '01', active: true },
      { nombre: 'Depilación\nLáser', num: '02', active: false },
      { nombre: 'Rejuvene-\ncimiento', num: '03', active: false },
      { nombre: 'Tratamientos\nCorporales', num: null, active: false },
    ],
    serviciosTitulo: 'Cuidado integral para tu belleza',
    serviciosSub: 'Desde una limpieza facial hasta tratamientos corporales avanzados: estética de alto nivel bajo un mismo techo.',
    servicios: [
      { icon: ICON.facial, nombre: 'Limpieza Facial Profunda', desc: 'Piel renovada, luminosa y libre de impurezas con un protocolo profesional a tu medida.', precio: 'desde $90.000', pts: ['Piel luminosa', 'Sin impurezas', 'Relajante'] },
      { icon: ICON.corporal, nombre: 'Tratamientos Corporales', desc: 'Reducción, reafirmación y modelado corporal con tecnología avanzada y resultados visibles.', precio: 'desde $150.000', pts: ['Reducción de medidas', 'Reafirmación', 'Modelado'] },
      { icon: ICON.laser, nombre: 'Depilación Láser', desc: 'Piel suave de forma duradera, sesión a sesión, con equipos seguros para todo tipo de piel.', precio: 'desde $80.000', pts: ['Resultados duraderos', 'Seguro', 'Poco dolor'] },
      { icon: ICON.hidrata, nombre: 'Rejuvenecimiento Facial', desc: 'Tratamientos antiedad para una piel firme y radiante que realzan tu belleza natural.', precio: 'desde $200.000', pts: ['Efecto antiedad', 'Piel firme', 'Aspecto natural'] },
      { icon: ICON.masaje, nombre: 'Masajes y Relajación', desc: 'Desconecta del estrés y recarga tu energía con masajes terapéuticos y de relajación.', precio: 'desde $110.000', pts: ['Antiestrés', 'Terapéutico', 'Bienestar total'] },
      { icon: ICON.radio, nombre: 'Radiofrecuencia', desc: 'Estimula el colágeno para una piel más firme y tonificada sin cirugía ni tiempo de recuperación.', precio: 'desde $130.000', pts: ['Estimula colágeno', 'Sin cirugía', 'Indoloro'] },
      { icon: ICON.brillo, nombre: 'Hidratación Profunda', desc: 'Devuelve la luminosidad y la hidratación a tu piel con activos de última generación.', precio: 'desde $100.000', pts: ['Piel hidratada', 'Luminosidad', 'Activos premium'] },
      { icon: ICON.urgencia, nombre: 'Valoración Express', desc: 'Analizamos tu piel y tus objetivos para diseñar el plan ideal, sin costo y sin compromiso.', precio: 'Sin costo', pts: ['Diagnóstico de piel', 'Plan a tu medida', 'Sin compromiso'] },
    ],
    whyTitulo: 'Una experiencia de belleza pensada para ti',
    whySub: 'Combinamos tecnología estética de vanguardia con un trato cercano, para que cada visita sea un placer.',
    why: [
      { icon: ICON.brillo, titulo: 'Tecnología avanzada', desc: 'Equipos de última generación para resultados visibles, seguros y duraderos en cada tratamiento.' },
      { icon: ICON.corazon, titulo: 'Experiencia a tu medida', desc: 'Valoramos tu piel y tus objetivos para diseñar un plan personalizado, sin tratamientos innecesarios.' },
      { icon: ICON.agenda, titulo: 'Horarios flexibles', desc: 'Agenda cómoda con cupos el mismo día y fines de semana para que cuidarte se adapte a tu rutina.' },
      { icon: ICON.billetera, titulo: 'Paquetes y planes', desc: 'Opciones y promociones para que cuidarte sea constante y cómodo para tu bolsillo.' },
      { icon: ICON.escudo, titulo: 'Espacio seguro', desc: 'Protocolos de higiene y bioseguridad impecables para que disfrutes tu visita con tranquilidad.' },
      { icon: ICON.premio, titulo: 'Equipo experto', desc: 'Profesionales certificados y apasionados por hacerte sentir y lucir radiante.' },
    ],
    procTitulo: 'Tu camino para lucir radiante',
    procSub: 'Cuatro pasos simples desde tu primer saludo hasta tu mejor versión.',
    pasos: [
      { num: '01', titulo: 'Agenda tu cita', desc: 'Escríbenos por WhatsApp en 60 segundos. Buscamos un horario que te sirva, muchas veces el mismo día.' },
      { num: '02', titulo: 'Plan personalizado', desc: 'Valoramos tu piel y tus objetivos para diseñar un plan claro, sin tratamientos innecesarios.' },
      { num: '03', titulo: 'Tratamiento relajante', desc: 'Disfruta de un ambiente que invita a desconectar mientras nuestras expertas cuidan de ti.' },
      { num: '04', titulo: 'Seguimiento', desc: 'Controles, recordatorios y un plan de mantenimiento para que tus resultados duren.' },
    ],
    s3Titulo1: 'Rejuvene-',
    s3Titulo2: 'cimiento',
    s3Sub: 'Recupera tu piel',
    s3ConsultLabel: 'Consulta',
    s3ConsultTitulo: 'Tratamientos<br/>faciales y<br/>corporales',
    s3Ov1: 'El proceso<br/>de tu<br/>tratamiento',
    s3Ov2: 'Cuidado<br/>de tu<br/>piel',
    teamTitulo: 'Las especialistas detrás de tu belleza',
    teamSub: 'Un equipo de profesionales en estética, cada una líder en su área.',
    equipo: [
      { iniciales: 'CM', nombre: 'Carolina Mejía', rol: 'Cosmetología facial', anios: '12 años', bio: 'Especialista en rejuvenecimiento y protocolos faciales con resultados naturales.' },
      { iniciales: 'PR', nombre: 'Paula Restrepo', rol: 'Estética corporal', anios: '14 años', bio: 'Experta en reducción y modelado corporal con tecnología de vanguardia.' },
      { iniciales: 'VS', nombre: 'Valentina Soto', rol: 'Depilación láser', anios: '9 años', bio: 'Domina equipos láser de última generación seguros para todo tipo de piel.' },
      { iniciales: 'AG', nombre: 'Ana Gómez', rol: 'Radiofrecuencia', anios: '11 años', bio: 'Tratamientos antiedad que estimulan el colágeno para una piel firme.' },
      { iniciales: 'LM', nombre: 'Laura Martínez', rol: 'Masaje terapéutico', anios: '10 años', bio: 'Convierte cada sesión en un momento de bienestar y desconexión total.' },
      { iniciales: 'DC', nombre: 'Daniela Castro', rol: 'Cuidado de la piel', anios: '8 años', bio: 'Apasionada por diseñar rutinas que realzan tu belleza natural.' },
    ],
    techTitulo: 'Estética de precisión, con base en la ciencia',
    techSub: 'Invertimos en los equipos más avanzados para que tus resultados sean visibles, seguros y duraderos.',
    tecnologias: [
      { titulo: 'Láser de diodo', desc: 'Depilación segura y eficaz para todo tipo de piel.' },
      { titulo: 'Radiofrecuencia', desc: 'Estimula el colágeno para una piel firme sin cirugía.' },
      { titulo: 'Cavitación', desc: 'Reducción de grasa localizada sin tiempo de recuperación.' },
      { titulo: 'Hydrafacial', desc: 'Limpieza e hidratación profunda en una sola sesión.' },
      { titulo: 'Presoterapia', desc: 'Mejora la circulación y reduce la retención de líquidos.' },
      { titulo: 'Análisis de piel digital', desc: 'Diagnóstico preciso para diseñar tu tratamiento ideal.' },
    ],
    tstTituloBase: 'Clientes felices',
    tstSub: 'Opiniones reales de clientes verificadas en Google.',
    testimonios: [
      { nombre: 'Jessica M.', lugar: '', texto: 'Mi piel cambió por completo. El trato es divino y siempre salgo sintiéndome renovada. Mil gracias.' },
      { nombre: 'Roberto T.', lugar: '', texto: 'Acompañé a mi pareja y quedé sorprendido con los resultados. Profesionales, limpios y muy atentos.' },
      { nombre: 'Amanda K.', lugar: '', texto: 'El mejor centro de estética de la ciudad. Resultados que se notan de verdad y un ambiente increíble.' },
      { nombre: 'Daniel P.', lugar: '', texto: 'La depilación láser fue rápida e indolora. La tecnología que usan aquí es de otro nivel.' },
      { nombre: 'Sofía L.', lugar: '', texto: 'Terminé mi tratamiento corporal y me siento increíble. El equipo se sintió como familia todo el tiempo.' },
      { nombre: 'Marcos W.', lugar: '', texto: 'Regalé un masaje y volví por más. Es mi momento de cuidarme. Así debería ser la estética.' },
    ],
    pricingTitulo: 'Cuidado accesible, sin complicaciones',
    pricingSub: 'Planes mensuales pensados para que cuidarte sea constante y cómodo para tu bolsillo.',
    planes: [
      { nombre: 'Esencial', precio: '59.900', periodo: '/ mes', desc: 'Ideal para mantener tu piel cuidada al día.', feat: false, features: ['1 limpieza facial al mes', 'Valoración de piel', 'Asesoría personalizada', '15% en todos los tratamientos', 'Sin trámites'] },
      { nombre: 'Glow', precio: '119.900', periodo: '/ mes', desc: 'La experiencia completa con los mejores beneficios.', feat: true, features: ['Todo lo del plan Esencial', '2 tratamientos al mes', '1 sesión de láser', '20% en todos los tratamientos', 'Prioridad para citas', 'Producto de regalo'] },
      { nombre: 'Premium', precio: '179.900', periodo: '/ mes', desc: 'Cuidado total con los tratamientos más avanzados.', feat: false, features: ['Todo lo del plan Glow', '1 radiofrecuencia al mes', '25% en tratamientos premium', 'Asesora dedicada', 'Financiación sin intereses'] },
    ],
    mediosPago: ['Nequi', 'Daviplata', 'Bancolombia', 'PSE', 'Visa', 'Mastercard', 'Addi', 'Sistecrédito'],
    faq: [
      { q: '¿Cómo sé qué tratamiento necesito?', a: 'Agenda una valoración: analizamos tu piel o tu caso y te recomendamos el tratamiento ideal para ti, sin costo y sin compromiso.' },
      { q: '¿Los tratamientos son dolorosos?', a: 'La mayoría son indoloros y muy relajantes. Te explicamos cada paso para que estés tranquila durante toda la sesión.' },
      { q: '¿Cuántas sesiones necesito?', a: 'Depende de cada tratamiento y de tu objetivo. En la valoración te damos un plan claro y realista con número de sesiones y resultados esperados.' },
      { q: '¿Manejan paquetes o promociones?', a: 'Sí, contamos con paquetes y planes mensuales desde $59.900 para que cuidarte sea cómodo. Escríbenos y te contamos las promos del mes.' },
      { q: '¿Puedo conseguir cita el mismo día?', a: 'Sí. Reservamos cupos todos los días para citas del mismo día. Escríbenos por WhatsApp y haremos lo posible por atenderte hoy.' },
      { q: '¿La depilación láser sirve para mi tipo de piel?', a: 'Nuestros equipos de última generación son seguros y eficaces para todo tipo de piel. En la valoración confirmamos el protocolo ideal para ti.' },
      { q: '¿Los resultados son duraderos?', a: 'Con el plan de mantenimiento adecuado, los resultados se conservan en el tiempo. Te acompañamos con controles y recomendaciones.' },
      { q: '¿Atienden sin cita previa?', a: 'Preferimos agendar para dedicarte el tiempo que mereces, pero escríbenos y buscamos el cupo más cercano, muchas veces el mismo día.' },
    ],
    ctaH1: 'Tu mejor versión',
    ctaH2: 'empieza hoy',
    ctaSub: 'Agenda tu valoración sin costo en menos de un minuto. Citas el mismo día disponibles.',
    contactFoco: 'piel',
    servOptions: ['Limpieza facial', 'Depilación láser', 'Tratamientos corporales', 'Rejuvenecimiento', 'Radiofrecuencia', 'Masajes', 'Valoración de piel', 'Otro'],
    footerDesc: 'Estética de confianza que combina tecnología de vanguardia con un trato cercano para que luzcas y te sientas radiante.',
    footerServLinks: ['Limpieza facial', 'Depilación láser', 'Corporales', 'Rejuvenecimiento', 'Masajes', 'Radiofrecuencia'],
    // Imágenes IA dedicadas en _assets/estetica/*.jpg (gente radiante, piel luminosa).
    assetDir: '_assets/estetica',
    assetExt: 'jpg',
    heroImg: unsplash(IMG.estetica.hero, 1100),
    galleryImg: unsplash(IMG.estetica.gallery, 1100),
    s3Img1: unsplash(IMG.estetica.s3a, 800),
    s3Img2: unsplash(IMG.estetica.s3b, 800),
    s3Bg: unsplash(IMG.estetica.s3bg, 1100),
  },
};

/* ------------------------------------------------------------------ */
/* CONSTRUCTORES DE HTML POR SECCIÓN                                   */
/* ------------------------------------------------------------------ */

const arrowSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const checkSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4L19 6"/></svg>';
const checkSmSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4L19 6"/></svg>';
const chevronSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
const quoteSvg = '<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h4v4c0 3-1.5 5-4 6V14H5V9a2 2 0 0 1 2-2Zm10 0h4v4c0 3-1.5 5-4 6v-3h-2V9a2 2 0 0 1 2-2Z"/></svg>';

function featureBarsHtml(bars: FeatureBar[]): string {
  return bars
    .map(
      (b) =>
        `<div class="feat-bar card reveal" data-mask><div class="lbl"><span>${escapeHtml(b.label)}</span></div></div>`,
    )
    .join('\n    ');
}

function statsHtml(extra: { v: string; suf: string; l: string }[], rating: string, resenasNum: number): string {
  const items: { v: string; dec: number; suf: string; l: string }[] = [
    { v: rating.replace(',', '.'), dec: 1, suf: '', l: 'Calificación Google' },
    { v: String(resenasNum || 0), dec: 0, suf: '+', l: 'Opiniones reales' },
    { v: extra[0].v, dec: 0, suf: extra[0].suf, l: extra[0].l },
    { v: extra[1].v, dec: 0, suf: extra[1].suf, l: extra[1].l },
  ];
  return items
    .map(
      (s) =>
        `<div class="stat"><span class="v" data-count="${s.v}" data-decimals="${s.dec}" data-suffix="${s.suf}">0</span><span class="l">${escapeHtml(s.l)}</span></div>`,
    )
    .join('\n      ');
}

function miniServiciosHtml(items: MiniServicio[]): string {
  return items
    .map((s) => {
      const num = s.num
        ? `<div class="num">${escapeHtml(s.num)}</div>`
        : '';
      return `<div class="gserv ${s.active ? 'on' : 'off'}"><h3>${escapeHtml(s.nombre)}</h3>${num}</div>`;
    })
    .join('\n          ');
}

function serviciosHtml(items: Servicio[]): string {
  return items
    .map((s, i) => {
      const pts = s.pts.map((p) => `<li>${checkSvg}${escapeHtml(p)}</li>`).join('');
      return `<div class="svc reveal">
        <div class="top">
          <span class="ic"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${s.icon}"/></svg></span>
          <span class="idx">${String(i + 1).padStart(2, '0')}</span>
        </div>
        <h3>${escapeHtml(s.nombre)}</h3>
        <p class="desc">${escapeHtml(s.desc)}</p>
        <ul class="pts">${pts}</ul>
        <div class="foot"><span class="price">${escapeHtml(s.precio)}</span><span class="go">${arrowSvg}</span></div>
      </div>`;
    })
    .join('\n      ');
}

function whyHtml(items: Why[]): string {
  return items
    .map(
      (w) => `<div class="why reveal">
        <span class="ic"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${w.icon}"/></svg></span>
        <h3>${escapeHtml(w.titulo)}</h3>
        <p>${escapeHtml(w.desc)}</p>
      </div>`,
    )
    .join('\n        ');
}

function pasosHtml(items: Paso[]): string {
  return items
    .map((p, i) => {
      const arr = i < items.length - 1 ? `<span class="arr">${arrowSvg}</span>` : '';
      return `<div class="proc reveal"><span class="n">${escapeHtml(p.num)}</span><h3>${escapeHtml(p.titulo)}</h3><p>${escapeHtml(p.desc)}</p>${arr}</div>`;
    })
    .join('\n      ');
}

function teamHtml(items: Miembro[]): string {
  return items
    .map(
      (m) => `<div class="tm reveal">
        <div class="row">
          <div class="av">${escapeHtml(m.iniciales)}</div>
          <div>
            <h3>${escapeHtml(m.nombre)}</h3>
            <p class="role">${escapeHtml(m.rol)}</p>
            <span class="badge">${escapeHtml(m.anios)}</span>
          </div>
        </div>
        <p>${escapeHtml(m.bio)}</p>
      </div>`,
    )
    .join('\n      ');
}

function techHtml(items: Tech[]): string {
  return items
    .map(
      (t) => `<div class="tc reveal">${checkSmSvg}<h3>${escapeHtml(t.titulo)}</h3><p>${escapeHtml(t.desc)}</p></div>`,
    )
    .join('\n        ');
}

function testimoniosHtml(items: Testimonio[], ciudad: string): string {
  return items
    .map((t) => {
      const lugar = t.lugar || ciudad;
      return `<figure class="tcard">
        <span class="q">${quoteSvg}</span>
        <span class="stars">${starsSvg(5)}</span>
        <blockquote>“${escapeHtml(t.texto)}”</blockquote>
        <figcaption>
          <span class="av">${escapeHtml(t.nombre.charAt(0))}</span>
          <span><span class="nm">${escapeHtml(t.nombre)}</span><span class="lo">${escapeHtml(lugar)}</span></span>
        </figcaption>
      </figure>`;
    })
    .join('\n        ');
}

function planesHtml(items: Plan[]): string {
  return items
    .map((p) => {
      const tag = p.feat ? '<span class="tag">Más popular</span>' : '';
      const feats = p.features
        .map((f) => `<li><span class="ck">${checkSmSvg}</span>${escapeHtml(f)}</li>`)
        .join('');
      return `<div class="plan ${p.feat ? 'feat' : ''}">
        <div class="ph"><h3>${escapeHtml(p.nombre)}</h3>${tag}</div>
        <p class="pd">${escapeHtml(p.desc)}</p>
        <div class="pp"><span class="amt">$${escapeHtml(p.precio)}</span><span class="per">${escapeHtml(p.periodo)}</span></div>
        <ul>${feats}</ul>
        <a class="pcta" href="{{WA_LINK}}" target="_blank" rel="noopener">Empezar</a>
      </div>`;
    })
    .join('\n      ');
}

function insurersHtml(items: string[]): string {
  return items.map((n) => `<span>${escapeHtml(n)}</span>`).join('\n        ');
}

function faqHtml(items: FaqItem[]): string {
  return items
    .map(
      (f) => `<div class="fq">
        <button><span class="q">${escapeHtml(f.q)}</span><span class="pm">${chevronSvg}</span></button>
        <div class="ans"><div class="ans-in"><p>${escapeHtml(f.a)}</p></div></div>
      </div>`,
    )
    .join('\n        ');
}

function servOptionsHtml(items: string[]): string {
  return items.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('\n              ');
}

function footerServLinksHtml(items: string[]): string {
  return items
    .map((l) => `<li><a data-go="#services" href="#services">${escapeHtml(l)}</a></li>`)
    .join('\n            ');
}

function socialLinksHtml(igUrl: string, fbUrl: string, webUrl: string): string {
  const items: { url: string; icon: string; label: string }[] = [];
  if (igUrl) items.push({ url: igUrl, icon: SOCIAL_ICON.instagram, label: 'Instagram' });
  if (fbUrl) items.push({ url: fbUrl, icon: SOCIAL_ICON.facebook, label: 'Facebook' });
  if (webUrl) items.push({ url: webUrl, icon: SOCIAL_ICON.web, label: 'Sitio web' });
  if (!items.length) return '';
  return items
    .map(
      (s) =>
        `<a href="${s.url}" target="_blank" rel="noopener" aria-label="${s.label}"><svg width="18" height="18" viewBox="0 0 24 24" fill="${s.label === 'Sitio web' ? 'none' : 'currentColor'}" stroke="${s.label === 'Sitio web' ? 'currentColor' : 'none'}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${s.icon}"/></svg></a>`,
    )
    .join('');
}

export function focoOdonto(nombre: string): { h1: string; h2: string } | null {
  const n = nombre.toLowerCase();
  if (/ortodonc|bracket|aline|invisalign/.test(n)) return { h1: 'Sonrisa', h2: 'Alineada' };
  if (/implant/.test(n)) return { h1: 'Implantes', h2: 'Dentales' };
  if (/est[eé]tic|dise[nñ]o|carilla|blanqueam/.test(n)) return { h1: 'Diseño de', h2: 'Sonrisa' };
  if (/infantil|ni[nñ]o|pediatr|kids/.test(n)) return { h1: 'Sonrisas', h2: 'Sanas' };
  return null;
}

/* ------------------------------------------------------------------ */
/* GENERACIÓN                                                          */
/* ------------------------------------------------------------------ */

export interface GenerateResult {
  leadId: number;
  relUrl: string;
  filePath: string;
}

export function generateDemo(lead: Lead): GenerateResult {
  const categoria: Categoria = lead.categoria === 'estetica' ? 'estetica' : 'odontologo';
  const perfil = PERFILES[categoria];
  const ciudad = ciudadDeDireccion(lead.direccion);
  const zona = zonaDeDireccion(lead.direccion);
  const ubicacion = zona ? `${zona}, ${ciudad}` : ciudad;
  const anio = new Date().getFullYear();
  const resenasNum = lead.resenas ?? 0;
  const ratingTxt = (lead.rating ?? 5).toString().replace('.', ',');

  const nombreCorto = nombreMarca(lead.nombre);
  const { l1, l2 } = logoLines(nombreCorto);

  // Imágenes: locales (../_assets/{vertical}/...) o URLs (Unsplash). Para OG/JSON-LD
  // usamos URL absoluta cuando hay hosting configurado (DEMOS_PUBLIC_BASE).
  const publicBase = (process.env.DEMOS_PUBLIC_BASE || '').replace(/\/$/, '');
  const img = (() => {
    if (perfil.assetDir) {
      const ext = perfil.assetExt;
      const rel = (n: string) => `../${perfil.assetDir}/${n}.${ext}`;
      const abs = (n: string) => (publicBase ? `${publicBase}/${perfil.assetDir}/${n}.${ext}` : rel(n));
      return {
        hero: rel('hero'), gallery: rel('gallery'),
        s3a: rel('s3a'), s3b: rel('s3b'), s3bg: rel('s3bg'),
        heroOg: abs('hero'), og: abs('hero'),
        s3aSet: '', s3bSet: '', s3bgSet: '',
      };
    }
    const id = IMG[categoria];
    return {
      hero: perfil.heroImg, gallery: perfil.galleryImg,
      s3a: perfil.s3Img1, s3b: perfil.s3Img2, s3bg: perfil.s3Bg,
      heroOg: perfil.heroImg,
      og: `https://images.unsplash.com/photo-${id.hero}?w=1200&h=630&fit=crop&crop=faces,center&q=80&auto=format`,
      s3aSet: unsplashSrcset(id.s3a, [400, 800]),
      s3bSet: unsplashSrcset(id.s3b, [400, 800]),
      s3bgSet: unsplashSrcset(id.s3bg, [768, 1100, 1600]),
    };
  })();

  // Hero: personalización por especialidad detectada en el nombre (solo dental).
  const foco = categoria === 'odontologo' ? focoOdonto(lead.nombre) : null;
  const heroH1_1 = foco?.h1 ?? perfil.heroH1_1;
  const heroH1_2 = foco?.h2 ?? perfil.heroH1_2;
  const heroPreCap = perfil.heroPreNoun.charAt(0).toUpperCase() + perfil.heroPreNoun.slice(1);
  const heroPre = `${heroPreCap} de confianza en ${ciudad}`;

  // Prueba social con datos REALES de Google.
  const noun = categoria === 'odontologo' ? 'pacientes' : 'clientes';
  const socialProof =
    resenasNum > 0 ? ` Más de ${resenasNum.toLocaleString('es-CO')} ${noun} nos califican con ${ratingTxt}★ en Google.` : '';
  const heroLeadPlain = perfil.heroTop + socialProof;
  const tstTitulo =
    resenasNum > 0
      ? `Más de ${resenasNum.toLocaleString('es-CO')} ${perfil.tstTituloBase.toLowerCase()}`
      : perfil.tstTituloBase;

  const mensajeWa = `Hola, vi su página y me gustaría agendar una cita en ${lead.nombre}.`;
  const wa = waLink(lead.telefono, mensajeWa);
  const waB = waBase(lead.telefono);

  const dirUrl = direccionesUrl(lead.direccion, lead.maps_url);

  const igUrl = redUrl('instagram', lead.instagram);
  const fbUrl = redUrl('facebook', lead.facebook);
  const webUrl = sitioUrl(lead.sitio_web);
  const socialsHtml = socialLinksHtml(igUrl, fbUrl, webUrl);

  let telDigits = (lead.telefono || '').replace(/\D/g, '');
  if (telDigits.length === 10) telDigits = '57' + telDigits;
  const telHref = telDigits ? `tel:+${telDigits}` : '#';

  // Favicon generado (inicial sobre negro) como data URI.
  const inicial = (lead.nombre.trim()[0] || 'V').toUpperCase();
  const faviconSvg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
    `<rect width="64" height="64" rx="14" fill="#000000"/>` +
    `<text x="50%" y="50%" dy="2" font-family="Arial,sans-serif" font-size="38" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${escapeHtml(inicial)}</text>` +
    `</svg>`;
  const faviconHref = `data:image/svg+xml,${encodeURIComponent(faviconSvg)}`;

  // JSON-LD (datos reales).
  const schemaType = categoria === 'estetica' ? 'BeautySalon' : 'Dentist';
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: lead.nombre,
    image: img.heroOg,
    description: heroLeadPlain,
    telephone: telDigits ? `+${telDigits}` : undefined,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: lead.direccion || undefined,
      addressLocality: ciudad,
      addressCountry: 'CO',
    },
    openingHours: 'Mo-Sa 08:00-19:00',
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
  const jsonLdStr = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

  // Pixel de seguimiento de apertura (solo si hay URL pública configurada).
  const trackSrc = trackPixelUrl(lead.id);
  const trackPixel = trackSrc
    ? `<img src="${escapeHtml(trackSrc)}" alt="" width="1" height="1" loading="eager" referrerpolicy="no-referrer" aria-hidden="true" style="position:absolute;width:1px;height:1px;left:-9999px;top:auto;opacity:0;" />`
    : '';

  // Mapa de ubicación real (escala de grises, on-theme) + acciones "Cómo llegar"
  // (rutea desde la ubicación actual del lead) y "Ver en Google Maps". Solo si hay
  // dirección; si no, no se inyecta nada.
  const mapaSrc = mapaEmbedUrl(lead.direccion, lead.nombre);
  const mapsHref = lead.maps_url || dirUrl;
  const flechaSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>';
  const mapaBlock = mapaSrc
    ? `<div class="ct-map">
        <iframe src="${escapeHtml(mapaSrc)}" title="Ubicación de ${escapeHtml(lead.nombre)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
        <div class="ct-map-bar">
          <span class="addr">${escapeHtml(lead.direccion || '')}</span>
          <span class="ct-map-actions">
            <a class="ct-map-btn" href="${escapeHtml(dirUrl)}" target="_blank" rel="noopener">Cómo llegar ${flechaSvg}</a>
            <a class="ct-map-link" href="${escapeHtml(mapsHref)}" target="_blank" rel="noopener">Ver en Google Maps</a>
          </span>
        </div>
      </div>`
    : '';

  // Meta social (og/twitter) + canonical.
  const canonical = publicBase ? `${publicBase}/${lead.id}/` : '';
  const ogImage = img.og;
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
    // SEO / meta
    SOCIAL_META: socialMeta,
    JSONLD: jsonLdStr,
    TRACK_PIXEL: trackPixel,
    MAPA_BLOCK: mapaBlock,
    FAVICON_HREF: faviconHref,
    NOMBRE: escapeHtml(lead.nombre),
    // Seguro dentro de un <script>: escapamos backslash/comillas y "<" (evita cerrar </script>).
    NOMBRE_JS: lead.nombre
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/</g, '\\u003c')
      .replace(/\r?\n/g, ' '),
    NOMBRE_CORTO: escapeHtml(nombreCorto),
    CAT_LABEL: escapeHtml(perfil.label),
    CIUDAD: escapeHtml(ciudad),
    UBICACION: escapeHtml(ubicacion),
    HERO_LEAD_PLAIN: escapeHtml(heroLeadPlain),
    // contacto / negocio
    DIRECCION: escapeHtml(lead.direccion || 'Consulta nuestra ubicación'),
    TELEFONO: escapeHtml(lead.telefono || 'Escríbenos'),
    TEL_HREF: telHref,
    WA_LINK: wa,
    WA_BASE: waB,
    MAPS_URL: lead.maps_url || '#',
    DIRECCIONES_URL: dirUrl,
    HORARIO_CORTO: 'Lun–Sáb 8AM–7PM',
    SOCIALS_HTML: socialsHtml,
    RATING: ratingTxt,
    RESENAS: resenasNum.toLocaleString('es-CO'),
    ESTRELLAS_SVG: starsSvg(Math.round(lead.rating ?? 5)),
    ANIO: String(anio),
    // logo
    LOGO_1: escapeHtml(l1),
    LOGO_2: escapeHtml(l2),
    LOGO_SUB: escapeHtml(perfil.logoSub),
    // hero
    FEATURE_BARS_HTML: featureBarsHtml(perfil.featureBars),
    HERO_IMG: img.hero,
    HERO_TOP: escapeHtml(perfil.heroTop),
    HERO_PRE: escapeHtml(heroPre),
    HERO_H1_1: escapeHtml(heroH1_1),
    HERO_H1_2: escapeHtml(heroH1_2),
    HERO_BR: escapeHtml(perfil.heroBr),
    // stats
    STATS_HTML: statsHtml(perfil.statsExtra, ratingTxt, resenasNum),
    // gallery
    GALLERY_IMG: img.gallery,
    GAL_TITULO: escapeHtml(perfil.galTitulo),
    GAL_SUB: escapeHtml(perfil.galSub),
    GAL_PROMO: escapeHtml(perfil.galPromo),
    GAL_CALL: escapeHtml(perfil.galCall),
    GAL_BIG_1: escapeHtml(perfil.galBig1),
    GAL_BIG_2: escapeHtml(perfil.galBig2),
    GALLERY_SERV_HTML: miniServiciosHtml(perfil.miniServicios),
    // services
    SERVICIOS_TITULO: escapeHtml(perfil.serviciosTitulo),
    SERVICIOS_SUB: escapeHtml(perfil.serviciosSub),
    SERVICIOS_HTML: serviciosHtml(perfil.servicios),
    // why
    WHY_TITULO: escapeHtml(perfil.whyTitulo),
    WHY_SUB: escapeHtml(perfil.whySub),
    WHY_HTML: whyHtml(perfil.why),
    // process
    PROCESS_TITULO: escapeHtml(perfil.procTitulo),
    PROCESS_SUB: escapeHtml(perfil.procSub),
    PROCESS_HTML: pasosHtml(perfil.pasos),
    // section 3
    S3_TITULO_1: escapeHtml(perfil.s3Titulo1),
    S3_TITULO_2: escapeHtml(perfil.s3Titulo2),
    S3_SUB: escapeHtml(perfil.s3Sub),
    S3_CONSULT_LABEL: escapeHtml(perfil.s3ConsultLabel),
    S3_CONSULT_TITULO: perfil.s3ConsultTitulo,
    S3_OV1: perfil.s3Ov1,
    S3_OV2: perfil.s3Ov2,
    S3_IMG1: img.s3a,
    S3_IMG2: img.s3b,
    S3_BG: img.s3bg,
    S3_IMG1_SRCSET: img.s3aSet,
    S3_IMG2_SRCSET: img.s3bSet,
    S3_BG_SRCSET: img.s3bgSet,
    // team
    TEAM_TITULO: escapeHtml(perfil.teamTitulo),
    TEAM_SUB: escapeHtml(perfil.teamSub),
    TEAM_HTML: teamHtml(perfil.equipo),
    // technology
    TECH_TITULO: escapeHtml(perfil.techTitulo),
    TECH_SUB: escapeHtml(perfil.techSub),
    TECH_HTML: techHtml(perfil.tecnologias),
    // testimonials
    TST_TITULO: escapeHtml(tstTitulo),
    TST_SUB: escapeHtml(perfil.tstSub),
    TESTIMONIOS_HTML: testimoniosHtml(perfil.testimonios, ciudad),
    // pricing
    PRICING_TITULO: escapeHtml(perfil.pricingTitulo),
    PRICING_SUB: escapeHtml(perfil.pricingSub),
    PLANES_HTML: planesHtml(perfil.planes),
    INSURERS_HTML: insurersHtml(perfil.mediosPago),
    // faq
    FAQ_HTML: faqHtml(perfil.faq),
    // cta
    CTA_H1: escapeHtml(perfil.ctaH1),
    CTA_H2: escapeHtml(perfil.ctaH2),
    CTA_SUB: escapeHtml(perfil.ctaSub),
    // contact
    CONTACT_FOCO: escapeHtml(perfil.contactFoco),
    CONTACT_SERVICE_OPTIONS: servOptionsHtml(perfil.servOptions),
    // footer
    FOOTER_DESC: escapeHtml(perfil.footerDesc),
    FOOTER_SERV_LINKS: footerServLinksHtml(perfil.footerServLinks),
    VERA_BRAND: escapeHtml(VERA_BRAND),
  };

  let html = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
  // Primer pase: el HTML de planes inserta {{WA_LINK}} interno, por eso reemplazamos
  // en bucle hasta que no queden placeholders conocidos (los planes traen WA_LINK).
  for (const [key, value] of Object.entries(replacements)) {
    html = html.replaceAll(`{{${key}}}`, value);
  }
  // Segundo pase para placeholders que vinieron DENTRO de un valor inyectado (WA_LINK en planes).
  html = html.replaceAll('{{WA_LINK}}', wa);

  const outDir = path.join(DEMOS_DIR, String(lead.id));
  fs.mkdirSync(outDir, { recursive: true });
  const filePath = path.join(outDir, 'index.html');
  fs.writeFileSync(filePath, html, 'utf-8');

  return { leadId: lead.id, relUrl: `/demos/${lead.id}/index.html`, filePath };
}
