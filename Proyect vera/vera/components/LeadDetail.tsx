'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Lead, Mensaje, Temperatura, Estado } from '@/lib/db';

const TEMPS: { t: Temperatura; label: string; icon: string }[] = [
  { t: 'frio', label: 'Frío', icon: '❄️' },
  { t: 'tibio', label: 'Tibio', icon: '🌡️' },
  { t: 'caliente', label: 'Caliente', icon: '🔥' },
];

const ESTADOS: Estado[] = ['nuevo', 'contactado', 'respondio', 'interesado', 'cerrado', 'descartado'];

export function LeadDetail({ initialLead, initialMensajes, publicDemoUrl }: { initialLead: Lead; initialMensajes: Mensaje[]; publicDemoUrl?: string | null }) {
  const [lead, setLead] = useState(initialLead);
  const [mensajes, setMensajes] = useState(initialMensajes);
  const [notas, setNotas] = useState(lead.notas || '');
  const [instagram, setInstagram] = useState(lead.instagram || '');
  const [facebook, setFacebook] = useState(lead.facebook || '');
  const [sitioWeb, setSitioWeb] = useState(lead.sitio_web || '');
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [testInfo, setTestInfo] = useState<{ testMode: boolean; testPhone: string | null } | null>(null);

  useEffect(() => {
    fetch('/api/whatsapp').then((r) => r.json()).then((d) => setTestInfo({ testMode: d.testMode, testPhone: d.testPhone })).catch(() => {});
  }, []);

  // Normaliza: si la URL termina en "/", apunta a index.html (Next no resuelve índices).
  const demoFullUrl = lead.demo_url ? lead.demo_url.replace(/\/$/, '/index.html') : '';
  // URL para "Abrir en pestaña": el link REAL de GitHub Pages si el hosting está
  // configurado (lo que ve el cliente); si no, cae a la ruta local del preview.
  const openUrl = publicDemoUrl || demoFullUrl;

  async function patch(p: Partial<Lead>) {
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
    });
    const data = await res.json();
    if (data.lead) setLead(data.lead);
  }

  async function generarDemo() {
    setBusy('demo');
    // Avisamos que puede tardar: al regenerar también republica a GitHub (push + poll hasta ~90s).
    setToast('Regenerando y republicando en GitHub… (puede tardar ~1 min)');
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id }), // republish = true por defecto
      });
      const data = await res.json();
      if (data.ok) {
        setLead({ ...lead, demo_url: data.demo_url });
        const pub = data.publish;
        if (pub && pub.ok && pub.live !== false) {
          setToast('Demo regenerado y republicado en GitHub ✓ — el link ya sirve la versión nueva.');
        } else if (pub && pub.ok && pub.live === false) {
          setToast('Demo regenerado y publicado ✓, pero el link aún no responde (GitHub tarda en la build). Espera ~1 min.');
        } else if (pub && !pub.configured) {
          setToast('Demo regenerado ✓ (hosting no configurado: no se republicó a GitHub).');
        } else if (pub && !pub.ok) {
          setToast(`Demo regenerado ✓, pero error al republicar: ${pub.error}`);
        } else {
          setToast('Demo generado ✓');
        }
      } else setToast(`Error: ${data.error}`);
    } finally {
      setBusy(null);
    }
  }

  // Flujo de un clic: generar demo → publicar online → enviar WhatsApp con el link en vivo.
  async function enviarTodo() {
    setBusy('todo');
    setToast('');
    try {
      // 1) Generar el demo
      setToast('1/3 · Generando demo…');
      const gen = await fetch('/api/demo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        // republish:false → este flujo publica en su propio paso 2 (no subir 2 veces).
        body: JSON.stringify({ leadId: lead.id, republish: false }),
      }).then((r) => r.json());
      if (!gen.ok) { setToast(`Error al generar: ${gen.error}`); return; }
      setLead((l) => ({ ...l, demo_url: gen.demo_url }));

      // 2) Publicar online (GitHub Pages)
      setToast('2/3 · Publicando online (puede tardar ~1 min la 1ª vez)…');
      const pub = await fetch('/api/publish', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id }),
      }).then((r) => r.json());
      if (!pub.configured) {
        setToast('⚠️ Hosting no configurado. Configúralo en .env.local (ver README) para enviar un link online en vez de localhost.');
        return;
      }
      if (!pub.ok) { setToast(`Error al publicar: ${pub.error}`); return; }
      if (pub.live === false) {
        setToast('⚠️ Publicado, pero el link aún no responde (GitHub Pages tarda en la 1ª build). Espera ~1 min y reintenta el envío.');
        return;
      }

      // 3) Enviar WhatsApp con el link en vivo
      setToast('3/3 · Enviando WhatsApp…');
      const wa = await fetch('/api/whatsapp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id }),
      }).then((r) => r.json());
      if (wa.ok) {
        setToast(`✓ Demo publicado y enviado por ${wa.via}. Hoy: ${wa.enviadosHoy} (quedan ${wa.restantes}).`);
        const refreshed = await fetch(`/api/leads/${lead.id}`).then((r) => r.json());
        setLead(refreshed.lead); setMensajes(refreshed.mensajes);
      } else if (wa.fallbackLink) {
        window.open(wa.fallbackLink, '_blank');
        setToast('Demo publicado. Evolution no conectado: abrí WhatsApp Web para envío manual.');
      } else {
        setToast(`Publicado, pero error al enviar: ${wa.error}`);
      }
    } finally {
      setBusy(null);
    }
  }

  async function enviarWhatsapp() {
    setBusy('wa');
    setToast('');
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id }),
      });
      const data = await res.json();
      if (data.ok && data.testMode) {
        setToast(`🧪 PRUEBA enviada a ${data.sentTo}. El lead real NO se modificó.`);
      } else if (data.ok) {
        setToast(`Enviado vía ${data.via}. Hoy: ${data.enviadosHoy} (quedan ${data.restantes}).`);
        const refreshed = await fetch(`/api/leads/${lead.id}`).then((r) => r.json());
        setLead(refreshed.lead);
        setMensajes(refreshed.mensajes);
      } else if (data.fallbackLink) {
        // Evolution no disponible: abrir wa.me manualmente
        window.open(data.fallbackLink, '_blank');
        setToast('Evolution no conectado: abrí WhatsApp Web para envío manual.');
      } else {
        setToast(`Error: ${data.error}`);
      }
    } finally {
      setBusy(null);
    }
  }

  const temp = (t: Temperatura) => () => { setLead({ ...lead, temperatura: t }); patch({ temperatura: t }); };

  return (
    <div className="reveal">
      <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ink-2)', fontSize: '0.88rem', marginBottom: '1rem' }}>
        ← Volver al pipeline
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: '1.75rem', alignItems: 'start' }}>
        {/* Columna principal */}
        <div>
          <div className="kicker"><span className="num">#{lead.id}</span> {lead.categoria === 'estetica' ? 'Estética' : lead.categoria === 'odontologo' ? 'Odontología' : 'Negocio'}</div>
          <h1 className="display" style={{ fontSize: 'clamp(2rem,4vw,3rem)', margin: '0.5rem 0 0.75rem' }}>{lead.nombre}</h1>
          <p style={{ color: 'var(--ink-2)', marginBottom: '0.5rem' }}>
            {lead.telefono || 'Sin teléfono'}{lead.direccion ? ` · ${lead.direccion}` : ''}
          </p>
          {lead.maps_url && (
            <a href={lead.maps_url} target="_blank" rel="noopener" className="link-underline" style={{ fontSize: '0.85rem' }}>Ver en Google Maps →</a>
          )}

          {/* Preview del demo */}
          <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 className="h-lg" style={{ fontSize: '1.4rem' }}>Demo de página web</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                {lead.demo_url && (
                  <a href={openUrl} target="_blank" rel="noopener" className="btn-line">Abrir en pestaña ↗</a>
                )}
                <button className="btn btn--clay" onClick={generarDemo} disabled={busy === 'demo'}>
                  <span>{busy === 'demo' ? 'Generando…' : lead.demo_url ? 'Regenerar' : 'Generar demo'}</span>
                </button>
              </div>
            </div>
            {lead.demo_url ? (
              <div className="panel" style={{ padding: '0.4rem' }}>
                <iframe src={demoFullUrl} title="Demo" style={{ width: '100%', height: 520, border: 'none', borderRadius: 'calc(var(--r-lg) - 0.4rem)', background: 'var(--paper)' }} />
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--ink-3)' }}>
                Aún no hay demo. Pulsa “Generar demo” para crear la página de muestra.
              </div>
            )}
          </div>

          {/* Historial de mensajes */}
          <div style={{ marginTop: '2rem' }}>
            <h2 className="h-lg" style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>Historial</h2>
            {mensajes.length === 0 ? (
              <p style={{ color: 'var(--ink-3)', fontSize: '0.9rem' }}>Sin mensajes todavía.</p>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {mensajes.map((m) => (
                  <div key={m.id} className="card" style={{ padding: '0.85rem 1rem', borderLeft: `3px solid ${m.direccion === 'enviado' ? 'var(--clay)' : 'var(--sage)'}` }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-3)', marginBottom: 4 }}>
                      {m.direccion} · {m.fecha}
                    </div>
                    <div style={{ fontSize: '0.9rem' }}>{m.texto}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel lateral de control */}
        <aside style={{ display: 'grid', gap: '1rem', position: 'sticky', top: '1rem' }}>
          {toast && (
            <div className="card" style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--sage)', borderColor: 'var(--sage)' }}>{toast}</div>
          )}

          <div className="card">
            <label className="lbl">WhatsApp</label>
            {testInfo?.testMode && (
              <div style={{ marginBottom: 10, padding: '0.5rem 0.7rem', borderRadius: 'var(--r-sm)', background: 'rgba(193,138,61,0.1)', border: '1px solid var(--gold)', fontSize: '0.74rem', color: 'var(--gold)', fontWeight: 600 }}>
                🧪 MODO PRUEBA — los envíos van solo a {testInfo.testPhone}, no al lead real.
              </div>
            )}
            <button className="btn btn--clay" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }} onClick={enviarTodo} disabled={busy === 'todo' || !lead.telefono}>
              <span>{busy === 'todo' ? 'Procesando…' : '⚡ Generar, publicar y enviar'}</span>
            </button>
            <button className="btn btn--whats" style={{ width: '100%', justifyContent: 'center' }} onClick={enviarWhatsapp} disabled={busy === 'wa' || !lead.telefono}>
              <span>{busy === 'wa' ? 'Enviando…' : 'Solo enviar WhatsApp'}</span>
            </button>
            <p style={{ fontSize: '0.72rem', color: 'var(--ink-3)', marginTop: 8 }}>
              “Generar, publicar y enviar” crea el demo, lo sube al hosting y manda el WhatsApp con el link en vivo. Plantilla rotativa (anti-baneo). Sin Evolution conectado, abre wa.me.
            </p>
          </div>

          <div className="card">
            <label className="lbl">Temperatura</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {TEMPS.map((x) => (
                <button key={x.t} onClick={temp(x.t)}
                  className="btn-line"
                  style={{ flex: 1, justifyContent: 'center', borderColor: lead.temperatura === x.t ? 'var(--clay)' : 'var(--line)', background: lead.temperatura === x.t ? 'rgba(182,90,54,0.07)' : 'transparent' }}>
                  {x.icon} {x.label}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <label className="lbl">Estado</label>
            <select className="field" value={lead.estado} onChange={(e) => { const v = e.target.value as Estado; setLead({ ...lead, estado: v }); patch({ estado: v }); }}>
              {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {lead.aperturas > 0 && (
            <div className="card" style={{ borderColor: 'var(--clay)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: 'var(--clay)' }}>
                <span>👀 Abrió su demo {lead.aperturas > 1 ? `${lead.aperturas} veces` : ''}</span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--ink-3)', marginTop: 8 }}>
                Señal de alta intención — el lead ya está 🔥 caliente.
                {lead.demo_abierta_en ? ` Última apertura: ${new Date(lead.demo_abierta_en).toLocaleString('es-CO')}.` : ''}
                {' '}Buen momento para escribirle.
              </p>
            </div>
          )}

          <div className="card">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!lead.confirmo_web} style={{ width: 18, height: 18, accentColor: 'var(--clay)' }}
                onChange={(e) => { const v = e.target.checked ? 1 : 0; setLead({ ...lead, confirmo_web: v }); patch({ confirmo_web: v }); }} />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Confirmó interés en la web</span>
            </label>
            <p style={{ fontSize: '0.72rem', color: 'var(--ink-3)', marginTop: 8 }}>
              Márcalo cuando el cliente acepte. Luego construyes la web real con Claude Code.
            </p>
          </div>

          <div className="card">
            <label className="lbl">Redes y sitio web</label>
            <p style={{ fontSize: '0.72rem', color: 'var(--ink-3)', margin: '0 0 8px' }}>
              Si los conoces, aparecerán en el demo (íconos en el mapa y el footer). Acepta @usuario o URL.
            </p>
            <input className="field" style={{ marginBottom: 6 }} value={instagram} placeholder="Instagram (@usuario)"
              onChange={(e) => setInstagram(e.target.value)}
              onBlur={() => { if (instagram !== (lead.instagram || '')) { setLead({ ...lead, instagram }); patch({ instagram }); } }} />
            <input className="field" style={{ marginBottom: 6 }} value={facebook} placeholder="Facebook (usuario o URL)"
              onChange={(e) => setFacebook(e.target.value)}
              onBlur={() => { if (facebook !== (lead.facebook || '')) { setLead({ ...lead, facebook }); patch({ facebook }); } }} />
            <input className="field" value={sitioWeb} placeholder="Sitio web actual (opcional)"
              onChange={(e) => setSitioWeb(e.target.value)}
              onBlur={() => { if (sitioWeb !== (lead.sitio_web || '')) { setLead({ ...lead, sitio_web: sitioWeb }); patch({ sitio_web: sitioWeb }); } }} />
          </div>

          <div className="card">
            <label className="lbl">Notas</label>
            <textarea className="field" rows={4} value={notas} onChange={(e) => setNotas(e.target.value)} onBlur={() => patch({ notas })} placeholder="Apuntes del seguimiento…" style={{ resize: 'vertical' }} />
          </div>
        </aside>
      </div>
    </div>
  );
}
