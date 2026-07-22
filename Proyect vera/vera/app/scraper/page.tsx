'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Business {
  nombre: string;
  categoria: string | null;
  telefono: string | null;
  direccion: string | null;
  maps_url: string | null;
  rating: number | null;
  resenas: number | null;
}

export default function ScraperPage() {
  const router = useRouter();
  const [query, setQuery] = useState('odontólogos');
  const [ciudad, setCiudad] = useState('Cali');
  const [cantidad, setCantidad] = useState(20);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('');
  const [results, setResults] = useState<Business[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  async function run() {
    setRunning(true);
    setResults([]);
    setSelected(new Set());
    setSavedMsg('');
    setStatus('Abriendo Google Maps…');

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, ciudad, cantidad }),
      });
      if (!res.body) throw new Error('Sin respuesta del servidor');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const collected: Business[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
          const ev = JSON.parse(line);
          if (ev.type === 'start') setStatus(`Buscando "${ev.query}" en ${ev.ciudad}…`);
          else if (ev.type === 'item') {
            collected.push(ev.business);
            setResults([...collected]);
            setSelected((prev) => new Set(prev).add(collected.length - 1));
            setStatus(`${collected.length} negocios encontrados…`);
          } else if (ev.type === 'done') setStatus(`✓ Listo. ${ev.total} negocios con teléfono.`);
          else if (ev.type === 'error') setStatus(`Error: ${ev.error}`);
        }
      }
    } catch (e) {
      setStatus(`Error: ${(e as Error).message}`);
    } finally {
      setRunning(false);
    }
  }

  function toggle(i: number) {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  }

  async function save() {
    setSaving(true);
    const leads = [...selected].map((i) => results[i]);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads }),
      });
      const data = await res.json();
      setSavedMsg(`Guardados ${data.guardados} · ${data.saltados} saltados (duplicados o sin teléfono).`);
      router.refresh();
    } catch (e) {
      setSavedMsg(`Error: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="reveal">
      <div className="kicker"><span className="num">01</span> Captura</div>
      <h1 className="display" style={{ marginTop: '0.6rem', marginBottom: '1.5rem' }}>
        Capturar <span className="serif-italic" style={{ color: 'var(--clay)' }}>leads</span>
      </h1>

      <div className="panel" style={{ maxWidth: 760, marginBottom: '2rem' }}>
        <div className="panel-in">
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 0.7fr', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label className="lbl">Qué buscar</label>
              <input className="field" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="odontólogos" />
            </div>
            <div>
              <label className="lbl">Ciudad</label>
              <input className="field" value={ciudad} onChange={(e) => setCiudad(e.target.value)} placeholder="Cali" />
            </div>
            <div>
              <label className="lbl">Cantidad</label>
              <input className="field" type="number" min={1} max={60} value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: '1.25rem' }}>
            <button className="btn btn--clay" onClick={run} disabled={running}>
              <span>{running ? 'Buscando…' : 'Iniciar búsqueda'}</span>
              {!running && <span className="ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg></span>}
            </button>
            {status && <span style={{ fontSize: '0.88rem', color: 'var(--ink-2)' }}>{status}</span>}
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--ink-3)', marginTop: '0.75rem' }}>
            Tip: usa términos como “odontólogos”, “clínica dental”, “centro de estética”, “spa facial”.
          </p>
        </div>
      </div>

      {results.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: '0.88rem', color: 'var(--ink-2)' }}>
              {selected.size} de {results.length} seleccionados
            </span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {savedMsg && <span style={{ fontSize: '0.82rem', color: 'var(--sage)' }}>{savedMsg}</span>}
              <button className="btn" onClick={save} disabled={saving || selected.size === 0}>
                <span>{saving ? 'Guardando…' : `Guardar ${selected.size}`}</span>
                <span className="ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg></span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            {results.map((b, i) => (
              <label key={i} className="card" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 16, alignItems: 'center', cursor: 'pointer', padding: '1rem 1.25rem' }}>
                <input type="checkbox" checked={selected.has(i)} onChange={() => toggle(i)} style={{ width: 18, height: 18, accentColor: 'var(--clay)' }} />
                <div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem' }}>{b.nombre}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--ink-2)', marginTop: 2 }}>
                    {b.telefono || 'sin teléfono'}{b.direccion ? ` · ${b.direccion}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {b.rating != null && <div style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem' }}>★ {b.rating}</div>}
                  {b.resenas != null && <div style={{ fontSize: '0.74rem', color: 'var(--ink-3)' }}>{b.resenas} opiniones</div>}
                </div>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
