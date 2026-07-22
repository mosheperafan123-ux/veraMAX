import { leadsParaSeguimiento, getLead, addMensaje, updateLead, mensajesEnviadosHoy, type Lead } from './db';
import { sendMessage } from './evolution';
import { buildSeguimiento, demoUrlFor } from './messages';
import { getAjustes, puedeEnviarAhora } from './antiban';

/**
 * Seguimiento por PLANTILLA (sin IA). A los leads contactados que NO
 * respondieron, tras `FOLLOWUP_HOURS` horas se les puede enviar un mensaje de
 * recordatorio (plantilla natural en la voz de Moshe). Máximo `FOLLOWUP_MAX`
 * seguimientos por lead, espaciados por el mismo intervalo de horas.
 *
 * Diseño: NO envía solo de forma agresiva. El panel muestra quién toca hoy y tú
 * decides (un clic por lead, o "enviar todos"). Para automatizarlo 100%, una
 * tarea programada puede llamar POST /api/followups (envía todos los que tocan).
 */

const HORAS = Number(process.env.FOLLOWUP_HOURS || 48);
const MAX = Number(process.env.FOLLOWUP_MAX || 2);
const TEST_MODE = process.env.TEST_MODE === 'true';
const TEST_PHONE = process.env.TEST_PHONE || '';

export interface SeguimientoPendiente {
  id: number;
  nombre: string;
  telefono: string | null;
  numero: number;        // qué seguimiento sería (1, 2, …)
  horasSinResponder: number;
  texto: string;         // mensaje exacto que se enviaría
  demoUrl: string;
}

/** Leads que hoy tocan seguimiento, con el texto listo a enviar. */
export function seguimientosPendientes(opts?: { horas?: number; max?: number }): SeguimientoPendiente[] {
  const horas = opts?.horas ?? HORAS;
  const max = opts?.max ?? MAX;
  return leadsParaSeguimiento(horas, max).map((lead) => {
    const numero = (lead.seguimientos || 0) + 1;
    return {
      id: lead.id,
      nombre: lead.nombre,
      telefono: lead.telefono,
      numero,
      horasSinResponder: horasDesde(lead.ultimo_contacto),
      texto: buildSeguimiento(lead, numero),
      demoUrl: demoUrlFor(lead),
    };
  });
}

function horasDesde(fecha: string | null): number {
  if (!fecha) return 0;
  // SQLite guarda UTC "naive" ("YYYY-MM-DD HH:MM:SS"); JS lo tomaría como hora
  // local. Si no trae zona horaria, lo normalizamos a UTC para no desfasar.
  const tieneTz = /[zZ]|[+-]\d\d:?\d\d$/.test(fecha);
  const iso = tieneTz ? fecha : fecha.replace(' ', 'T') + 'Z';
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.round(ms / 3_600_000));
}

export interface EnvioSeguimiento {
  ok: boolean;
  id: number;
  nombre: string;
  numero?: number;
  testMode?: boolean;
  sentTo?: string;
  error?: string;
}

/** Envía el seguimiento que corresponde a un lead. Respeta modo prueba y límite diario. */
export async function enviarSeguimientoLead(lead: Lead): Promise<EnvioSeguimiento> {
  if (!lead.telefono) return { ok: false, id: lead.id, nombre: lead.nombre, error: 'sin teléfono' };

  const numero = (lead.seguimientos || 0) + 1;
  const texto = buildSeguimiento(lead, numero);

  // Modo prueba: va al número de prueba y NO modifica el lead real.
  if (TEST_MODE) {
    if (!TEST_PHONE) return { ok: false, id: lead.id, nombre: lead.nombre, error: 'falta TEST_PHONE' };
    const r = await sendMessage(TEST_PHONE, `🧪 PRUEBA · Seguimiento #${numero} (${lead.nombre})\n\n${texto}`);
    return { ok: r.ok, id: lead.id, nombre: lead.nombre, numero, testMode: true, sentTo: TEST_PHONE, error: r.error };
  }

  const r = await sendMessage(lead.telefono, texto);
  if (!r.ok) return { ok: false, id: lead.id, nombre: lead.nombre, error: r.error };

  addMensaje(lead.id, 'enviado', texto);
  updateLead(lead.id, { seguimientos: numero, ultimo_contacto: new Date().toISOString() });
  return { ok: true, id: lead.id, nombre: lead.nombre, numero };
}

/** Envía el seguimiento de un lead por id (valida que de verdad toque). */
export async function enviarSeguimiento(leadId: number): Promise<EnvioSeguimiento> {
  const lead = getLead(leadId);
  if (!lead) return { ok: false, id: leadId, nombre: '?', error: 'lead no encontrado' };
  if (!TEST_MODE) {
    const ventana = puedeEnviarAhora();
    if (!ventana.ok) return { ok: false, id: leadId, nombre: lead.nombre, error: ventana.motivo };
  }
  const limite = getAjustes().limiteDiario;
  if (mensajesEnviadosHoy() >= limite) {
    return { ok: false, id: leadId, nombre: lead.nombre, error: `límite diario (${limite}) alcanzado` };
  }
  return enviarSeguimientoLead(lead);
}

export interface RunResult {
  horas: number;
  enviados: EnvioSeguimiento[];
}

/** Envía TODOS los seguimientos que tocan hoy (para tarea programada o "enviar todos"). */
export async function runSeguimientos(opts?: { horas?: number; max?: number }): Promise<RunResult> {
  const horas = opts?.horas ?? HORAS;
  const max = opts?.max ?? MAX;

  // Anti-baneo: no enviar en lote fuera del horario hábil (salvo modo prueba).
  if (!TEST_MODE) {
    const ventana = puedeEnviarAhora();
    if (!ventana.ok) return { horas, enviados: [] };
  }

  const limite = getAjustes().limiteDiario;
  const candidatos = leadsParaSeguimiento(horas, max);
  const enviados: EnvioSeguimiento[] = [];

  for (const lead of candidatos) {
    if (mensajesEnviadosHoy() >= limite) break; // protege el número
    enviados.push(await enviarSeguimientoLead(lead));
  }
  return { horas, enviados };
}
