// SQLite integrado en Node 24 (sin módulos nativos ni compilación).
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

/**
 * Cliente SQLite local. Crea el archivo webleads.db y las tablas
 * la primera vez que se usa. Singleton entre hot-reloads de Next.
 */

export const DB_PATH = path.join(process.cwd(), 'webleads.db');

export type Estado =
  | 'nuevo'
  | 'contactado'
  | 'respondio'
  | 'interesado'
  | 'cerrado'
  | 'descartado';

export type Temperatura = 'frio' | 'tibio' | 'caliente';
export type Categoria = 'odontologo' | 'estetica';

export interface Lead {
  id: number;
  nombre: string;
  categoria: Categoria | null;
  telefono: string | null;
  direccion: string | null;
  maps_url: string | null;
  rating: number | null;
  resenas: number | null;
  instagram: string | null;
  facebook: string | null;
  sitio_web: string | null;
  estado: Estado;
  temperatura: Temperatura;
  demo_url: string | null;
  confirmo_web: number; // 0 | 1
  seguimientos: number; // # de mensajes de seguimiento enviados
  aperturas: number; // # de veces que el lead abrió su demo (pixel de seguimiento)
  demo_abierta_en: string | null; // fecha de la última apertura de la demo
  notas: string | null;
  contactado_en: string | null;
  ultimo_contacto: string | null;
  creado_en: string;
}

export interface Mensaje {
  id: number;
  lead_id: number;
  direccion: 'enviado' | 'recibido';
  texto: string;
  fecha: string;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  categoria TEXT,
  telefono TEXT UNIQUE,
  direccion TEXT,
  maps_url TEXT,
  rating REAL,
  resenas INTEGER,
  instagram TEXT,
  facebook TEXT,
  sitio_web TEXT,
  estado TEXT DEFAULT 'nuevo',
  temperatura TEXT DEFAULT 'frio',
  demo_url TEXT,
  confirmo_web INTEGER DEFAULT 0,
  notas TEXT,
  contactado_en TEXT,
  ultimo_contacto TEXT,
  creado_en TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS mensajes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  direccion TEXT,
  texto TEXT,
  fecha TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS config (
  clave TEXT PRIMARY KEY,
  valor TEXT
);

CREATE INDEX IF NOT EXISTS idx_leads_estado ON leads(estado);
CREATE INDEX IF NOT EXISTS idx_mensajes_lead ON mensajes(lead_id);
`;

// Singleton: evita abrir el archivo varias veces durante el dev de Next.
const globalForDb = globalThis as unknown as { __veraDb?: DatabaseSync };

/** Añade columnas nuevas a tablas viejas sin perder datos (idempotente). */
function migrate(db: DatabaseSync): void {
  // node:sqlite no soporta "ADD COLUMN IF NOT EXISTS"; ignoramos el error si ya existe.
  const nuevas = ['instagram TEXT', 'facebook TEXT', 'sitio_web TEXT', 'seguimientos INTEGER DEFAULT 0', 'aperturas INTEGER DEFAULT 0', 'demo_abierta_en TEXT'];
  for (const col of nuevas) {
    try { db.exec(`ALTER TABLE leads ADD COLUMN ${col}`); } catch { /* ya existe */ }
  }
  // Idempotencia del webhook: id de mensaje de Evolution (único; permite NULL en salientes).
  try { db.exec(`ALTER TABLE mensajes ADD COLUMN evo_id TEXT`); } catch { /* ya existe */ }
  try { db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_mensajes_evo ON mensajes(evo_id)`); } catch { /* ya existe */ }
}

function init(): DatabaseSync {
  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(SCHEMA);
  migrate(db);
  return db;
}

export function getDb(): DatabaseSync {
  if (!globalForDb.__veraDb) {
    globalForDb.__veraDb = init();
  }
  return globalForDb.__veraDb;
}

/* ----------------------------- Helpers ----------------------------- */

export function listLeads(filters?: {
  categoria?: Categoria;
  temperatura?: Temperatura;
  estado?: Estado;
  sinWeb?: boolean; // solo negocios sin web propia (candidatos ideales del pitch)
}): Lead[] {
  const db = getDb();
  const where: string[] = [];
  const params: Record<string, string> = {};
  if (filters?.categoria) { where.push('categoria = @categoria'); params.categoria = filters.categoria; }
  if (filters?.temperatura) { where.push('temperatura = @temperatura'); params.temperatura = filters.temperatura; }
  if (filters?.estado) { where.push('estado = @estado'); params.estado = filters.estado; }
  if (filters?.sinWeb) { where.push(`(sitio_web IS NULL OR trim(sitio_web) = '')`); }
  const sql = `SELECT * FROM leads ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY creado_en DESC`;
  // node:sqlite devuelve objetos con prototipo null; los pasamos a objetos planos
  // para que Next pueda serializarlos hacia los Client Components.
  return (db.prepare(sql).all(params) as unknown[]).map((r) => ({ ...(r as object) })) as Lead[];
}

export function getLead(id: number): Lead | undefined {
  const row = getDb().prepare('SELECT * FROM leads WHERE id = ?').get(id);
  return row ? ({ ...(row as object) } as Lead) : undefined;
}

/** Busca un lead por teléfono comparando los últimos 10 dígitos (ignora prefijo 57/+). */
export function getLeadByPhone(telefono: string): Lead | undefined {
  const last10 = telefono.replace(/\D/g, '').slice(-10);
  if (last10.length < 10) return undefined;
  const row = getDb()
    .prepare(`SELECT * FROM leads WHERE replace(replace(telefono,'+',''),' ','') LIKE '%' || ? ORDER BY id DESC LIMIT 1`)
    .get(last10);
  return row ? ({ ...(row as object) } as Lead) : undefined;
}

/**
 * Leads para SEGUIMIENTO: ya contactados, sin respuesta (estado 'contactado'),
 * cuyo último contacto fue hace >= `horas` horas, y con menos de `maxSeg`
 * seguimientos enviados.
 */
export function leadsParaSeguimiento(horas: number, maxSeg: number): Lead[] {
  const sql = `
    SELECT * FROM leads
    WHERE estado = 'contactado'
      AND telefono IS NOT NULL
      AND ultimo_contacto IS NOT NULL
      AND COALESCE(seguimientos, 0) < @maxSeg
      AND (julianday('now') - julianday(ultimo_contacto)) * 24 >= @horas
    ORDER BY ultimo_contacto ASC`;
  return (getDb().prepare(sql).all({ horas, maxSeg }) as unknown[]).map((r) => ({ ...(r as object) })) as Lead[];
}

/**
 * Leads candidatos a limpieza: tienen demo publicado, fueron contactados hace
 * más de `dias` días y NO han respondido (siguen en 'contactado').
 */
export function leadsExpirados(dias: number): Lead[] {
  const sql = `
    SELECT * FROM leads
    WHERE demo_url IS NOT NULL
      AND estado = 'contactado'
      AND ultimo_contacto IS NOT NULL
      AND julianday('now') - julianday(ultimo_contacto) >= @dias
    ORDER BY ultimo_contacto ASC`;
  return (getDb().prepare(sql).all({ dias }) as unknown[]).map((r) => ({ ...(r as object) })) as Lead[];
}

export interface NewLead {
  nombre: string;
  categoria?: Categoria | null;
  telefono?: string | null;
  direccion?: string | null;
  maps_url?: string | null;
  rating?: number | null;
  resenas?: number | null;
  sitio_web?: string | null;
}

/** Inserta un lead; ignora duplicados por teléfono. Devuelve el id o null si se saltó. */
export function insertLead(lead: NewLead): number | null {
  if (!lead.telefono) return null; // sin teléfono no sirve para contactar
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO leads (nombre, categoria, telefono, direccion, maps_url, rating, resenas, sitio_web)
    VALUES (@nombre, @categoria, @telefono, @direccion, @maps_url, @rating, @resenas, @sitio_web)
  `);
  const info = stmt.run({
    nombre: lead.nombre,
    categoria: lead.categoria ?? null,
    telefono: lead.telefono ?? null,
    direccion: lead.direccion ?? null,
    maps_url: lead.maps_url ?? null,
    rating: lead.rating ?? null,
    resenas: lead.resenas ?? null,
    sitio_web: lead.sitio_web ?? null,
  });
  return info.changes > 0 ? Number(info.lastInsertRowid) : null;
}

export function updateLead(id: number, patch: Partial<Lead>): void {
  const allowed: (keyof Lead)[] = [
    'estado', 'temperatura', 'notas', 'demo_url', 'confirmo_web',
    'contactado_en', 'ultimo_contacto', 'seguimientos',
    'instagram', 'facebook', 'sitio_web',
  ];
  const sets: string[] = [];
  const params: Record<string, string | number | null> = { id };
  for (const key of allowed) {
    if (key in patch) {
      sets.push(`${key} = @${key}`);
      params[key] = (patch as Record<string, string | number | null>)[key];
    }
  }
  if (!sets.length) return;
  getDb().prepare(`UPDATE leads SET ${sets.join(', ')} WHERE id = @id`).run(params);
}

export function listMensajes(leadId: number): Mensaje[] {
  return (getDb()
    .prepare('SELECT * FROM mensajes WHERE lead_id = ? ORDER BY fecha ASC')
    .all(leadId) as unknown[]).map((r) => ({ ...(r as object) })) as Mensaje[];
}

/**
 * Inserta un mensaje. Si se pasa `evoId` (id de Evolution), la inserción es
 * idempotente: si ese id ya existe (reintento del webhook), NO duplica y devuelve
 * false. Devuelve true si insertó una fila nueva.
 */
export function addMensaje(
  leadId: number,
  direccion: 'enviado' | 'recibido',
  texto: string,
  evoId?: string | null,
): boolean {
  const info = getDb()
    .prepare('INSERT OR IGNORE INTO mensajes (lead_id, direccion, texto, evo_id) VALUES (?, ?, ?, ?)')
    .run(leadId, direccion, texto, evoId ?? null);
  return info.changes > 0;
}

/* ------------------------------ Config (k/v) ------------------------------ */

/** Lee un valor de configuración (o null si no está). */
export function getConfig(clave: string): string | null {
  const row = getDb().prepare('SELECT valor FROM config WHERE clave = ?').get(clave) as { valor: string } | undefined;
  return row ? row.valor : null;
}

/** Guarda (upsert) un valor de configuración. */
export function setConfig(clave: string, valor: string): void {
  getDb()
    .prepare('INSERT INTO config (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor')
    .run(clave, valor);
}

/** Cuántos mensajes 'enviado' se registraron hoy (control anti-baneo). */
export function mensajesEnviadosHoy(): number {
  const row = getDb()
    .prepare(`SELECT COUNT(*) AS n FROM mensajes WHERE direccion = 'enviado' AND date(fecha) = date('now', 'localtime')`)
    .get() as unknown as { n: number };
  return row.n;
}

/* --------------------------- Conversaciones --------------------------- */

export interface Conversacion {
  leadId: number; nombre: string; telefono: string | null;
  temperatura: Temperatura; estado: Estado;
  ultimoMsg: string | null; ultimoMsgDir: 'enviado' | 'recibido' | null; fecha: string | null;
  sinLeer: boolean; // último mensaje fue del cliente (recibido) → pendiente de responder
}

/**
 * Lista para la bandeja de chat: TODO lead que tenga al menos un mensaje.
 * Incluye preview del último mensaje, estilo WhatsApp. Ordena: pendientes de
 * responder primero (último mensaje recibido), luego por actividad reciente.
 */
export function listConversaciones(): Conversacion[] {
  const sql = `
    SELECT
      l.id AS leadId, l.nombre, l.telefono, l.temperatura, l.estado,
      m.texto AS ultimoMsg, m.direccion AS ultimoMsgDir, m.fecha AS fecha
    FROM leads l
    JOIN mensajes m ON m.id = (
      SELECT mm.id FROM mensajes mm WHERE mm.lead_id = l.id ORDER BY mm.fecha DESC, mm.id DESC LIMIT 1
    )
    ORDER BY (m.direccion = 'recibido') DESC, m.fecha DESC`;
  return (getDb().prepare(sql).all() as unknown[]).map((r) => {
    const o = r as Record<string, unknown>;
    return {
      leadId: o.leadId as number,
      nombre: o.nombre as string,
      telefono: (o.telefono as string) ?? null,
      temperatura: (o.temperatura as Temperatura) || 'frio',
      estado: (o.estado as Estado) || 'nuevo',
      ultimoMsg: (o.ultimoMsg as string) ?? null,
      ultimoMsgDir: (o.ultimoMsgDir as 'enviado' | 'recibido') ?? null,
      fecha: (o.fecha as string) ?? null,
      sinLeer: o.ultimoMsgDir === 'recibido',
    } as Conversacion;
  });
}

/** Cuántos leads tienen el último mensaje sin responder (badge de la bandeja). */
export function sinResponderCount(): number {
  const row = getDb().prepare(`
    SELECT COUNT(*) AS n FROM leads l
    WHERE (SELECT mm.direccion FROM mensajes mm WHERE mm.lead_id = l.id ORDER BY mm.fecha DESC, mm.id DESC LIMIT 1) = 'recibido'
  `).get() as unknown as { n: number };
  return row.n;
}

export { fs };
