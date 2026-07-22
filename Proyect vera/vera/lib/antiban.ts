import { getConfig, setConfig } from './db';

/**
 * Protecciones "no quemar el número": detección de opt-out (bajas) y ventana de
 * horario hábil para enviar. Las funciones puras (`esOptOut`, `dentroDeHorario`)
 * concentran la lógica y se testean directo; los ajustes viven en la tabla
 * `config` (editables desde el dashboard) con los `.env` como valores por defecto.
 */

/* ------------------------------- Opt-out ------------------------------- */

// Frases de baja inequívocas (tras quitar acentos y pasar a minúsculas). Se evita
// "no" a secas o "no gracias" para no descartar leads tibios por error.
const OPTOUT = [
  /no me interesa/,
  /no (?:me )?escrib/,           // no escriban, no me escriban
  /no (?:me )?contacten/,
  /no (?:me )?insist/,
  /no (?:me )?moleste/,
  /dejen de (?:escribir|molestar|insistir|contactar|enviar)/,
  /dar de baja|darme de baja|me doy de baja|de baja/,
  /borrenme|eliminenme|quitenme|sacarme de/,
  /\bstop\b/,
  /unsubscribe/,
];

/** ¿El texto de un cliente es una solicitud clara de NO ser contactado más? */
export function esOptOut(texto: string): boolean {
  const t = (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, ''); // sin acentos
  if (!t.trim()) return false;
  return OPTOUT.some((p) => p.test(t));
}

/* ------------------------------ Horario ------------------------------ */

export interface HorarioConfig {
  horaInicio: number; // 0–23 (inclusive)
  horaFin: number;    // 1–24 (exclusivo)
  dias: number[];     // 0=Domingo … 6=Sábado (días activos)
}

/**
 * ¿`fecha` cae dentro de la ventana de envío? Se evalúa en hora de Colombia
 * (UTC-5), independiente de la zona horaria del servidor, para no enviar de
 * madrugada aunque el proceso corra en otra TZ.
 */
export function dentroDeHorario(fecha: Date, cfg: HorarioConfig): boolean {
  const co = new Date(fecha.getTime() - 5 * 3_600_000); // desplaza a UTC-5
  const dia = co.getUTCDay();
  const hora = co.getUTCHours();
  if (!cfg.dias.includes(dia)) return false;
  return hora >= cfg.horaInicio && hora < cfg.horaFin;
}

/* --------------------------- Ajustes (config) --------------------------- */

export interface Ajustes extends HorarioConfig {
  limiteDiario: number; // tope de mensajes por día (anti-baneo)
}

const DEF_INICIO = Number(process.env.HORARIO_INICIO || 8);
const DEF_FIN = Number(process.env.HORARIO_FIN || 19);
const DEF_DIAS = (process.env.HORARIO_DIAS || '1,2,3,4,5,6'); // L–S por defecto
const DEF_LIMITE = Number(process.env.DAILY_MESSAGE_LIMIT || 25);

function parseDias(s: string | null, fallback: number[]): number[] {
  if (s == null) return fallback;          // no configurado → default
  if (s.trim() === '') return [];          // vacío → sin días (pausa total)
  const ns = s.split(',').map((x) => Number(x.trim())).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
  return Array.from(new Set(ns)).sort();
}

/** Ajustes efectivos: tabla `config` si existe, si no los defaults de `.env`. */
export function getAjustes(): Ajustes {
  const horaInicio = Number(getConfig('horaInicio') ?? DEF_INICIO);
  const horaFin = Number(getConfig('horaFin') ?? DEF_FIN);
  const dias = parseDias(getConfig('dias'), parseDias(DEF_DIAS, [1, 2, 3, 4, 5, 6]));
  const limiteDiario = Number(getConfig('limiteDiario') ?? DEF_LIMITE);
  return { horaInicio, horaFin, dias, limiteDiario };
}

/** Guarda ajustes desde el dashboard (solo los campos presentes). */
export function setAjustes(patch: Partial<Ajustes>): void {
  if (patch.horaInicio != null) setConfig('horaInicio', String(patch.horaInicio));
  if (patch.horaFin != null) setConfig('horaFin', String(patch.horaFin));
  if (patch.dias != null) setConfig('dias', patch.dias.join(','));
  if (patch.limiteDiario != null) setConfig('limiteDiario', String(patch.limiteDiario));
}

/** ¿Se puede enviar ahora? Devuelve el motivo si no (para mostrarlo en el panel). */
export function puedeEnviarAhora(ahora: Date = new Date()): { ok: boolean; motivo?: string } {
  const a = getAjustes();
  if (!dentroDeHorario(ahora, a)) {
    return { ok: false, motivo: `Fuera del horario de envío (${a.horaInicio}:00–${a.horaFin}:00, días ${a.dias.join(',')}). Configúralo en Ajustes.` };
  }
  return { ok: true };
}
