// Siembra una SIMULACIÓN de conversaciones para ver la bandeja de chat con
// datos realistas (contactos + mensajes enviados/recibidos). Idempotente: borra
// la simulación anterior (notas='__SIM__') y la vuelve a crear.
//
//   node scripts/seed-sim.mjs           -> crea la simulación
//   node scripts/seed-sim.mjs --clean   -> solo borra la simulación
//
// No toca tus leads reales. Los leads de simulación se marcan con notas='__SIM__'.

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

const db = new DatabaseSync(path.join(process.cwd(), 'webleads.db'));
db.exec('PRAGMA foreign_keys = ON');

// Asegura columnas nuevas (idempotente; node:sqlite no tiene IF NOT EXISTS).
for (const col of ['instagram TEXT', 'facebook TEXT', 'sitio_web TEXT', 'seguimientos INTEGER DEFAULT 0']) {
  try { db.exec(`ALTER TABLE leads ADD COLUMN ${col}`); } catch { /* ya existe */ }
}

// Limpia simulación previa (cascade borra mensajes).
const sims = db.prepare(`SELECT id FROM leads WHERE notas='__SIM__'`).all();
for (const s of sims) {
  db.prepare('DELETE FROM mensajes WHERE lead_id=?').run(s.id);
  db.prepare('DELETE FROM leads WHERE id=?').run(s.id);
}
console.log(`Limpiados ${sims.length} leads de simulación previos.`);

if (process.argv.includes('--clean')) {
  console.log('Listo (solo limpieza).');
  process.exit(0);
}

const insLead = db.prepare(`
  INSERT INTO leads (nombre, categoria, telefono, direccion, maps_url, rating, resenas,
    estado, temperatura, demo_url, confirmo_web, seguimientos,
    notas, contactado_en, ultimo_contacto, creado_en)
  VALUES (@nombre,@categoria,@telefono,@direccion,@maps_url,@rating,@resenas,
    @estado,@temperatura,@demo_url,0,@seguimientos,
    '__SIM__', datetime('now',@contactOffset), datetime('now',@ultimoOffset), datetime('now',@creadoOffset))
`);
const insMsg = db.prepare(`
  INSERT INTO mensajes (lead_id, direccion, texto, fecha)
  VALUES (?, ?, ?, datetime('now', ?))
`);

const DEMO_BASE = process.env.DEMOS_PUBLIC_BASE || 'https://mosheperafan123-ux.github.io/vera-demos';

function crear(lead, mensajes) {
  const info = insLead.run(lead);
  const id = Number(info.lastInsertRowid);
  for (const m of mensajes) insMsg.run(id, m.dir, m.texto, m.off);
  return id;
}

// 1) Respondió preguntando precio (pendiente de responder).
crear(
  {
    nombre: 'Clínica Dental Sonríe', categoria: 'odontologo', telefono: '3009990001',
    direccion: 'Cra. 43A #5-12, El Poblado, Medellín', maps_url: 'https://maps.google.com/?q=Clinica+Dental+Sonrie',
    rating: 4.8, resenas: 132, estado: 'respondio', temperatura: 'tibio',
    demo_url: `${DEMO_BASE}/9001/`, seguimientos: 0,
    contactOffset: '-1 day', ultimoOffset: '-3 hours', creadoOffset: '-2 days',
  },
  [
    { dir: 'enviado', texto: '¡Hola! 🙌 Soy diseñador web y al ver *Clínica Dental Sonríe* en Google Maps me animé a hacerles una página de muestra (sin compromiso): ' + `${DEMO_BASE}/9001/` + ' Me encantaría saber su opinión.', off: '-1 day' },
    { dir: 'recibido', texto: 'Hola, sí la vi. Quedó muy bonita la verdad 😮', off: '-185 minutes' },
    { dir: 'recibido', texto: '¿Cuánto cuesta tenerla?', off: '-3 hours' },
  ],
);

// 2) Muy interesado, pendiente de responder (caliente).
crear(
  {
    nombre: 'Estética Bella Piel', categoria: 'estetica', telefono: '3009990002',
    direccion: 'Av. 6 Nte. #23-40, Granada, Cali', maps_url: 'https://maps.google.com/?q=Estetica+Bella+Piel',
    rating: 4.9, resenas: 211, estado: 'respondio', temperatura: 'caliente',
    demo_url: `${DEMO_BASE}/9002/`, seguimientos: 0,
    contactOffset: '-2 days', ultimoOffset: '-25 minutes', creadoOffset: '-3 days',
  },
  [
    { dir: 'enviado', texto: '¡Hola! 🙌 Soy diseñador web. Vi *Estética Bella Piel* en Google Maps e hice una página de muestra para ustedes (sin compromiso): ' + `${DEMO_BASE}/9002/`, off: '-2 days' },
    { dir: 'recibido', texto: '¡Wow! Me encantó 😍😍', off: '-30 minutes' },
    { dir: 'recibido', texto: 'Justo estábamos buscando algo así. ¿Cómo la contrato?', off: '-25 minutes' },
  ],
);

// 3) Recién contactado, sin respuesta (frío) — candidato a seguimiento.
crear(
  {
    nombre: 'Odontología Integral Norte', categoria: 'odontologo', telefono: '3009990003',
    direccion: 'Calle 100 #15-20, Bogotá', maps_url: 'https://maps.google.com/?q=Odontologia+Integral+Norte',
    rating: 4.5, resenas: 64, estado: 'contactado', temperatura: 'frio',
    demo_url: `${DEMO_BASE}/9003/`, seguimientos: 0,
    contactOffset: '-50 hours', ultimoOffset: '-50 hours', creadoOffset: '-3 days',
  },
  [
    { dir: 'enviado', texto: '¡Hola! 🙌 Soy diseñador web y al ver *Odontología Integral Norte* en Google Maps les hice una página de muestra (sin compromiso): ' + `${DEMO_BASE}/9003/` + ' Me encantaría saber qué opinan.', off: '-50 hours' },
  ],
);

// 4) Objeción de desconfianza, pendiente de responder.
crear(
  {
    nombre: 'Spa Renacer', categoria: 'estetica', telefono: '3009990004',
    direccion: 'Cra. 35 #8-15, Barranquilla', maps_url: 'https://maps.google.com/?q=Spa+Renacer',
    rating: 4.7, resenas: 98, estado: 'respondio', temperatura: 'tibio',
    demo_url: `${DEMO_BASE}/9004/`, seguimientos: 0,
    contactOffset: '-1 day', ultimoOffset: '-1 hour', creadoOffset: '-2 days',
  },
  [
    { dir: 'enviado', texto: '¡Hola! 🙌 Soy diseñador web. Hice una página de muestra para *Spa Renacer* (sin compromiso): ' + `${DEMO_BASE}/9004/`, off: '-1 day' },
    { dir: 'recibido', texto: 'Hola, está linda pero… ¿esto es gratis o después me van a cobrar un montón?', off: '-1 hour' },
  ],
);

// 5) Conversación ya atendida (último mensaje tuyo) — interesado agendando.
crear(
  {
    nombre: 'Centro Odontológico Smile', categoria: 'odontologo', telefono: '3009990005',
    direccion: 'Cra. 70 #45-10, Medellín', maps_url: 'https://maps.google.com/?q=Centro+Odontologico+Smile',
    rating: 4.6, resenas: 150, estado: 'interesado', temperatura: 'caliente',
    demo_url: `${DEMO_BASE}/9005/`, seguimientos: 0,
    contactOffset: '-3 days', ultimoOffset: '-20 hours', creadoOffset: '-4 days',
  },
  [
    { dir: 'enviado', texto: '¡Hola! 🙌 Soy diseñador web. Les hice una página de muestra (sin compromiso): ' + `${DEMO_BASE}/9005/`, off: '-3 days' },
    { dir: 'recibido', texto: 'Buenas, me parece interesante. ¿Cómo sería el proceso?', off: '-2 days' },
    { dir: 'enviado', texto: 'Súper sencillo: yo me encargo de todo. Me pasas logo y datos, y en ~1 semana queda lista con tu dominio y conectada al WhatsApp. ¿Hacemos una llamada de 10 min?', off: '-1195 minutes' },
    { dir: 'recibido', texto: 'Dale, hablemos mañana en la tarde 👍', off: '-20 hours' },
  ],
);

const total = db.prepare(`SELECT COUNT(*) n FROM leads WHERE notas='__SIM__'`).get().n;
const msgs = db.prepare(`SELECT COUNT(*) n FROM mensajes WHERE lead_id IN (SELECT id FROM leads WHERE notas='__SIM__')`).get().n;
console.log(`Simulación creada: ${total} conversaciones, ${msgs} mensajes.`);
