import path from 'node:path';
import fs from 'node:fs';
import { getDb } from './db';

/**
 * Respaldo de la base de datos (leads + conversaciones), el activo crítico.
 * Usa `VACUUM INTO` → copia consistente aunque la DB esté en uso (WAL). Guarda
 * snapshots rotados en `backups/` y permite descargarlos para llevarlos fuera del
 * PC. Las funciones puras (nombre/rotación/¿hay de hoy?) se testean directo.
 */

const BACKUPS_DIR = path.join(process.cwd(), 'backups');
const RE_RESPALDO = /^webleads-\d{8}-\d{6}\.db$/;
const KEEP_DEFAULT = 10;

const pad = (n: number) => String(n).padStart(2, '0');

/** Nombre del archivo de respaldo para una fecha (UTC): webleads-YYYYMMDD-HHmmss.db */
export function nombreRespaldo(d: Date): string {
  const f = `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
  const h = `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
  return `webleads-${f}-${h}.db`;
}

/** De una lista de nombres, los respaldos a borrar para conservar solo los `keep` más recientes. */
export function seleccionarParaBorrar(nombres: string[], keep: number): string[] {
  const validos = nombres.filter((n) => RE_RESPALDO.test(n)).sort().reverse(); // más nuevo primero
  return validos.slice(Math.max(0, keep));
}

/** ¿Existe ya un respaldo creado hoy (UTC)? */
export function hayRespaldoDeHoy(nombres: string[], hoy: Date): boolean {
  const pref = `webleads-${hoy.getUTCFullYear()}${pad(hoy.getUTCMonth() + 1)}${pad(hoy.getUTCDate())}`;
  return nombres.some((n) => RE_RESPALDO.test(n) && n.startsWith(pref));
}

export interface Respaldo {
  nombre: string;
  bytes: number;
  fecha: string; // ISO de creación
}

function infoDe(nombre: string): Respaldo {
  const st = fs.statSync(path.join(BACKUPS_DIR, nombre));
  return { nombre, bytes: st.size, fecha: st.mtime.toISOString() };
}

/** Lista los respaldos existentes (más nuevo primero). */
export function listarRespaldos(): Respaldo[] {
  if (!fs.existsSync(BACKUPS_DIR)) return [];
  return fs
    .readdirSync(BACKUPS_DIR)
    .filter((n) => RE_RESPALDO.test(n))
    .sort()
    .reverse()
    .map(infoDe);
}

/** Crea un respaldo consistente (VACUUM INTO) y rota los antiguos. */
export function crearRespaldo(keep = KEEP_DEFAULT): Respaldo {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  const nombre = nombreRespaldo(new Date());
  const dest = path.join(BACKUPS_DIR, nombre);

  // Si ya existe uno con este mismo segundo, lo reutilizamos (VACUUM INTO falla si el destino existe).
  if (!fs.existsSync(dest)) {
    // SQLite acepta '/' en Windows; escapamos comillas simples del path por seguridad.
    const sqlPath = dest.replace(/\\/g, '/').replace(/'/g, "''");
    getDb().exec(`VACUUM INTO '${sqlPath}'`);
  }

  for (const viejo of seleccionarParaBorrar(fs.readdirSync(BACKUPS_DIR), keep)) {
    try { fs.rmSync(path.join(BACKUPS_DIR, viejo)); } catch { /* ya no está */ }
  }
  return infoDe(nombre);
}

/** Crea un respaldo solo si aún no hay uno de hoy. Nunca lanza (auto al abrir el panel). */
export function respaldoDiarioSiHaceFalta(): Respaldo | null {
  try {
    if (hayRespaldoDeHoy(listarRespaldos().map((r) => r.nombre), new Date())) return null;
    return crearRespaldo();
  } catch {
    return null;
  }
}

/** Ruta absoluta de un respaldo para descargarlo (valida el nombre; null si no existe). */
export function rutaRespaldo(nombre: string): string | null {
  if (!RE_RESPALDO.test(nombre)) return null;
  const p = path.join(BACKUPS_DIR, nombre);
  return fs.existsSync(p) ? p : null;
}
