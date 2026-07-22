'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

interface Conv {
  leadId: number; nombre: string; telefono: string | null;
  temperatura: string; estado: string;
  ultimoMsg: string | null; ultimoMsgDir: 'enviado' | 'recibido' | null;
  fecha: string | null; sinLeer: boolean;
}
interface Msg { id: number; direccion: 'enviado' | 'recibido'; texto: string; fecha: string; }

const TEMP_ICON: Record<string, string> = { frio: '❄️', tibio: '🌡️', caliente: '🔥' };

function horaCorta(fecha: string | null): string {
  if (!fecha) return '';
  // formato "YYYY-MM-DD HH:MM..." o ISO → "MM-DD HH:MM"
  return fecha.replace('T', ' ').slice(5, 16);
}

export function Chat({ conversations, testMode, testPhone }: { conversations: Conv[]; testMode: boolean; testPhone: string | null }) {
  const [convs, setConvs] = useState(conversations);
  const [sel, setSel] = useState<number | null>(conversations[0]?.leadId ?? null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [composer, setComposer] = useState('');
  const [busy, setBusy] = useState('');
  const [toast, setToast] = useState('');
  const [demoUrl, setDemoUrl] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMsgId = useRef<number>(0);

  const selConv = convs.find((c) => c.leadId === sel) || null;

  const refreshConvs = useCallback(async () => {
    const d = await fetch('/api/conversaciones').then((r) => r.json()).catch(() => null);
    if (d?.conversaciones) setConvs(d.conversaciones);
  }, []);

  const loadLead = useCallback(async (id: number, silent = false) => {
    if (!silent) setBusy('load');
    const lead = await fetch(`/api/leads/${id}`).then((r) => r.json()).catch(() => null);
    if (lead) {
      const nuevos: Msg[] = lead.mensajes || [];
      const ultimo = nuevos.length ? nuevos[nuevos.length - 1].id : 0;
      // En polling silencioso, solo actualiza si llegó algo nuevo (evita parpadeo/scroll).
      if (!silent || ultimo !== lastMsgId.current) {
        setMsgs(nuevos);
        lastMsgId.current = ultimo;
      }
      setDemoUrl(lead.lead?.demo_url ? String(lead.lead.demo_url).replace(/\/$/, '/index.html') : null);
    }
    if (!silent) setBusy('');
  }, []);

  // Cargar al cambiar de conversación.
  useEffect(() => { if (sel != null) loadLead(sel); }, [sel, loadLead]);

  // Auto-refresh: la lista cada 8s y el chat abierto cada 6s (el webhook ya
  // guardó las respuestas entrantes en la BD; aquí solo las traemos).
  useEffect(() => {
    const a = setInterval(() => refreshConvs(), 8000);
    return () => clearInterval(a);
  }, [refreshConvs]);
  useEffect(() => {
    if (sel == null) return;
    const b = setInterval(() => loadLead(sel, true), 6000);
    return () => clearInterval(b);
  }, [sel, loadLead]);

  // Auto-scroll al último mensaje.
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  async function enviar() {
    if (!composer.trim() || sel == null) return;
    setBusy('send'); setToast('');
    const res = await fetch('/api/whatsapp', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: sel, texto: composer }),
    }).then((r) => r.json());
    setBusy('');
    if (res.ok) {
      setToast(res.testMode ? `🧪 Enviado a prueba (${res.sentTo})` : 'Enviado ✓');
      setComposer('');
      loadLead(sel, true); refreshConvs();
    } else if (res.fallbackLink) {
      window.open(res.fallbackLink, '_blank');
      setToast('Evolution no conectado: abrí WhatsApp Web.');
    } else setToast(`Error: ${res.error || 'no se pudo enviar'}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); }
  }

  if (!convs.length) {
    return (
      <div className="panel" style={{ maxWidth: 560 }}>
        <div className="panel-in" style={{ textAlign: 'center', color: 'var(--ink-2)' }}>
          <p className="lead" style={{ margin: '0 auto', fontSize: '1rem' }}>
            Aún no hay conversaciones. Cuando envíes una demo a un lead y el cliente responda,
            la charla aparecerá aquí y te avisaremos por WhatsApp.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 14, height: 'calc(100vh - 150px)', minHeight: 600 }}>
      {/* Lista de conversaciones */}
      <div className="card" style={{ padding: 8, overflowY: 'auto' }}>
        {convs.map((c) => (
          <button key={c.leadId} onClick={() => setSel(c.leadId)}
            style={{ width: '100%', textAlign: 'left', padding: '0.7rem 0.8rem', borderRadius: 'var(--r-sm)', marginBottom: 4, background: c.leadId === sel ? 'var(--paper-2)' : 'transparent', border: '1px solid', borderColor: c.leadId === sel ? 'var(--line)' : 'transparent', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 6 }}>
                {c.sinLeer && <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--sage)', flex: 'none' }} />}
                {c.nombre}
              </span>
              <span style={{ flex: 'none', fontSize: '0.8rem' }}>{TEMP_ICON[c.temperatura] || ''}</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: c.sinLeer ? 'var(--ink-2)' : 'var(--ink-3)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: c.sinLeer ? 600 : 400 }}>
              {c.ultimoMsg
                ? <>{c.ultimoMsgDir === 'enviado' ? 'Tú: ' : ''}{c.ultimoMsg}</>
                : c.estado}
            </div>
          </button>
        ))}
      </div>

      {/* Chat */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '0.8rem 1.1rem', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '1.15rem' }}>{selConv?.nombre || 'Selecciona una conversación'}</div>
            {selConv && (
              <div style={{ fontSize: '0.76rem', color: 'var(--ink-3)' }}>
                {selConv.telefono || 'sin teléfono'} · {selConv.estado} · {TEMP_ICON[selConv.temperatura]} {selConv.temperatura}
              </div>
            )}
          </div>
          {sel != null && (
            <div style={{ display: 'flex', gap: 6 }}>
              {demoUrl && <a href={demoUrl} target="_blank" rel="noopener" className="btn-line" style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}>Ver demo ↗</a>}
              <Link href={`/leads/${sel}`} className="btn-line" style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}>Ver lead ↗</Link>
            </div>
          )}
        </div>

        {/* Mensajes */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--paper)' }}>
          {busy === 'load' ? <span style={{ color: 'var(--ink-3)', fontSize: '0.85rem' }}>Cargando…</span> :
            msgs.length === 0 ? <span style={{ color: 'var(--ink-3)', fontSize: '0.85rem', margin: 'auto' }}>Sin mensajes aún.</span> :
              msgs.map((m) => (
                <div key={m.id} style={{ alignSelf: m.direccion === 'enviado' ? 'flex-end' : 'flex-start', maxWidth: '72%', background: m.direccion === 'enviado' ? 'var(--sage)' : 'var(--card)', color: m.direccion === 'enviado' ? '#fff' : 'var(--ink)', padding: '0.6rem 0.9rem', borderRadius: 14, border: m.direccion === 'enviado' ? 'none' : '1px solid var(--line)', fontSize: '0.92rem', whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
                  {m.texto}
                  <div style={{ fontSize: '0.62rem', opacity: 0.7, marginTop: 4, textAlign: 'right' }}>{horaCorta(m.fecha)}</div>
                </div>
              ))}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        {sel != null && (
          <div style={{ borderTop: '1px solid var(--line)', padding: '0.75rem 1.1rem' }}>
            {toast && <div style={{ fontSize: '0.78rem', color: 'var(--sage)', marginBottom: 6 }}>{toast}</div>}
            {testMode && <div style={{ fontSize: '0.72rem', color: 'var(--gold)', marginBottom: 6 }}>🧪 Modo prueba — los envíos van a {testPhone}, no al cliente real.</div>}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea className="field" rows={2} value={composer} onChange={(e) => setComposer(e.target.value)} onKeyDown={onKeyDown}
                placeholder="Escribe tu respuesta…  (Enter envía · Shift+Enter salto de línea)" style={{ resize: 'none', flex: 1 }} />
              <button className="btn btn--whats" onClick={enviar} disabled={!!busy || !composer.trim()} style={{ fontSize: '0.9rem' }}>
                {busy === 'send' ? 'Enviando…' : 'Enviar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
