'use client';

import { useState } from 'react';

export interface Respaldo {
  nombre: string;
  bytes: number;
  fecha: string;
}

function kb(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function cuando(iso: string): string {
  try { return new Date(iso).toLocaleString('es-CO'); } catch { return iso; }
}

export function Respaldos({ initial }: { initial: Respaldo[] }) {
  const [lista, setLista] = useState<Respaldo[]>(initial);
  const [estado, setEstado] = useState<'idle' | 'creando' | 'error'>('idle');

  async function crear() {
    setEstado('creando');
    try {
      const res = await fetch('/api/backup', { method: 'POST' });
      if (!res.ok) throw new Error();
      const lst = await fetch('/api/backup').then((r) => r.json());
      setLista(lst.respaldos || []);
      setEstado('idle');
    } catch {
      setEstado('error');
    }
  }

  return (
    <div className="card" style={{ maxWidth: 620 }}>
      <label className="lbl">Respaldo de datos</label>
      <p style={{ fontSize: '0.78rem', color: 'var(--ink-3)', margin: '0 0 14px' }}>
        Guarda una copia de tus leads y conversaciones. Se crea una automática al día;
        <strong> descarga la última y guárdala fuera del PC</strong> (Drive, correo) para no perder nada.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <button className="btn btn--clay" onClick={crear} disabled={estado === 'creando'}>
          <span>{estado === 'creando' ? 'Creando…' : 'Crear respaldo ahora'}</span>
        </button>
        {estado === 'error' && <span style={{ fontSize: '0.82rem', color: 'var(--clay)' }}>No se pudo crear</span>}
      </div>

      {lista.length === 0 ? (
        <p style={{ fontSize: '0.8rem', color: 'var(--ink-3)' }}>Aún no hay respaldos.</p>
      ) : (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {lista.map((r) => (
            <li key={r.nombre} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 12px', border: '1px solid var(--line-soft)', borderRadius: 10 }}>
              <span style={{ fontSize: '0.8rem' }}>
                <span style={{ fontWeight: 600 }}>{cuando(r.fecha)}</span>
                <span style={{ color: 'var(--ink-3)' }}> · {kb(r.bytes)}</span>
              </span>
              <a className="btn-line" href={`/api/backup?descargar=${encodeURIComponent(r.nombre)}`} download
                style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--clay)' }}>
                Descargar
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
