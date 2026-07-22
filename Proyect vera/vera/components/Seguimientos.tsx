'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Pendiente {
  id: number; nombre: string; telefono: string | null;
  numero: number; horasSinResponder: number; texto: string; demoUrl: string;
}

export function Seguimientos({ initial, testMode, testPhone }: { initial: Pendiente[]; testMode: boolean; testPhone: string | null }) {
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState<number | 'all' | null>(null);
  const [toast, setToast] = useState('');

  async function refrescar() {
    const d = await fetch('/api/followups').then((r) => r.json()).catch(() => null);
    if (d?.pendientes) setItems(d.pendientes);
  }

  async function enviarUno(id: number) {
    setBusy(id); setToast('');
    const r = await fetch('/api/followups', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: id }),
    }).then((x) => x.json());
    setBusy(null);
    if (r.ok) {
      setToast(r.testMode ? `🧪 Seguimiento #${r.numero} enviado a prueba (${r.sentTo})` : `Seguimiento #${r.numero} enviado a ${r.nombre} ✓`);
      setItems((xs) => xs.filter((x) => x.id !== id));
    } else setToast(`Error: ${r.error}`);
  }

  async function enviarTodos() {
    if (!items.length) return;
    setBusy('all'); setToast('');
    const r = await fetch('/api/followups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then((x) => x.json());
    setBusy(null);
    const ok = (r.enviados || []).filter((e: { ok: boolean }) => e.ok).length;
    setToast(`Enviados ${ok} de ${(r.enviados || []).length} seguimientos.`);
    refrescar();
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 14, background: 'var(--paper-2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <p style={{ fontSize: '0.86rem', color: 'var(--ink-2)', margin: 0, maxWidth: 620 }}>
            Estos leads fueron contactados y <strong>no han respondido</strong>. El sistema preparó un mensaje
            de recordatorio (plantilla natural, sin IA). Revísalo y envíalo con un clic — o todos a la vez.
            {testMode && <span style={{ color: 'var(--gold)' }}> 🧪 En modo prueba todo va a {testPhone}.</span>}
          </p>
          {items.length > 0 && (
            <button className="btn btn--clay" onClick={enviarTodos} disabled={busy !== null} style={{ flex: 'none' }}>
              {busy === 'all' ? 'Enviando…' : `Enviar todos (${items.length})`}
            </button>
          )}
        </div>
        {toast && <div style={{ fontSize: '0.82rem', color: 'var(--sage)', marginTop: 10 }}>{toast}</div>}
      </div>

      {items.length === 0 ? (
        <div className="panel" style={{ maxWidth: 560 }}>
          <div className="panel-in" style={{ textAlign: 'center', color: 'var(--ink-2)' }}>
            <p className="lead" style={{ margin: '0 auto', fontSize: '1rem' }}>
              Nada por seguir hoy 🎉 Cuando un lead lleve sin responder el tiempo configurado, aparecerá aquí
              con su recordatorio listo.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10, maxWidth: 860 }}>
          {items.map((p) => (
            <div key={p.id} className="card" style={{ display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div>
                  <Link href={`/leads/${p.id}`} style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem' }}>{p.nombre}</Link>
                  <span style={{ fontSize: '0.76rem', color: 'var(--ink-3)', marginLeft: 8 }}>
                    Seguimiento #{p.numero} · {p.horasSinResponder}h sin responder · {p.telefono || 'sin teléfono'}
                  </span>
                </div>
                <button className="btn btn--whats" onClick={() => enviarUno(p.id)} disabled={busy !== null} style={{ flex: 'none', fontSize: '0.85rem' }}>
                  {busy === p.id ? 'Enviando…' : 'Enviar seguimiento'}
                </button>
              </div>
              <div style={{ fontSize: '0.86rem', color: 'var(--ink-2)', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', padding: '0.7rem 0.9rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {p.texto}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
