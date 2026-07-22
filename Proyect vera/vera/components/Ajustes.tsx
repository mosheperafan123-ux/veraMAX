'use client';

import { useState } from 'react';

export interface Ajustes {
  horaInicio: number;
  horaFin: number;
  dias: number[];
  limiteDiario: number;
}

const DIAS = [
  { n: 1, label: 'Lun' }, { n: 2, label: 'Mar' }, { n: 3, label: 'Mié' },
  { n: 4, label: 'Jue' }, { n: 5, label: 'Vie' }, { n: 6, label: 'Sáb' }, { n: 0, label: 'Dom' },
];

export function AjustesForm({ initial }: { initial: Ajustes }) {
  const [a, setA] = useState<Ajustes>(initial);
  const [estado, setEstado] = useState<'idle' | 'guardando' | 'ok' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const toggleDia = (n: number) =>
    setA((prev) => ({
      ...prev,
      dias: prev.dias.includes(n) ? prev.dias.filter((d) => d !== n) : [...prev.dias, n].sort(),
    }));

  async function guardar() {
    setEstado('guardando'); setError(null);
    try {
      const res = await fetch('/api/ajustes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(a),
      });
      if (!res.ok) throw new Error('No se pudo guardar');
      const fresco = await res.json();
      setA(fresco);
      setEstado('ok');
      setTimeout(() => setEstado('idle'), 2500);
    } catch (e) {
      setEstado('error'); setError((e as Error).message);
    }
  }

  const horarioInvalido = a.horaFin <= a.horaInicio;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 620 }}>
      <div className="card">
        <label className="lbl">Horario de envío (hora de Colombia)</label>
        <p style={{ fontSize: '0.78rem', color: 'var(--ink-3)', margin: '0 0 14px' }}>
          Solo se envían mensajes (iniciales y seguimientos) dentro de esta ventana. Protege tu número de verse como bot.
        </p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label className="lbl" style={{ fontSize: '0.72rem' }}>Desde</label>
            <select className="field" style={{ width: 110 }} value={a.horaInicio}
              onChange={(e) => setA({ ...a, horaInicio: Number(e.target.value) })}>
              {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
            </select>
          </div>
          <div>
            <label className="lbl" style={{ fontSize: '0.72rem' }}>Hasta</label>
            <select className="field" style={{ width: 110 }} value={a.horaFin}
              onChange={(e) => setA({ ...a, horaFin: Number(e.target.value) })}>
              {Array.from({ length: 24 }, (_, h) => h + 1).map((h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
            </select>
          </div>
        </div>
        {horarioInvalido && <p style={{ fontSize: '0.74rem', color: 'var(--clay)', marginTop: 8 }}>La hora de fin debe ser mayor que la de inicio.</p>}
      </div>

      <div className="card">
        <label className="lbl">Días activos</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          {DIAS.map((d) => {
            const on = a.dias.includes(d.n);
            return (
              <button key={d.n} type="button" onClick={() => toggleDia(d.n)} aria-pressed={on}
                style={{
                  padding: '8px 14px', borderRadius: 999, fontSize: '0.82rem', fontWeight: 600,
                  border: '1px solid var(--clay)', cursor: 'pointer',
                  color: on ? '#fff' : 'var(--clay)', background: on ? 'var(--clay)' : 'transparent',
                }}>
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card">
        <label className="lbl">Límite diario de mensajes</label>
        <p style={{ fontSize: '0.78rem', color: 'var(--ink-3)', margin: '0 0 14px' }}>
          Tope de envíos por día. Mantenlo bajo (20–30) para un número nuevo y súbelo de a poco.
        </p>
        <input className="field" type="number" min={1} max={200} style={{ width: 140 }} value={a.limiteDiario}
          onChange={(e) => setA({ ...a, limiteDiario: Number(e.target.value) })} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button className="btn btn--clay" onClick={guardar} disabled={estado === 'guardando' || horarioInvalido}>
          <span>{estado === 'guardando' ? 'Guardando…' : 'Guardar ajustes'}</span>
        </button>
        {estado === 'ok' && <span style={{ fontSize: '0.82rem', color: 'var(--sage)', fontWeight: 600 }}>✓ Guardado</span>}
        {estado === 'error' && <span style={{ fontSize: '0.82rem', color: 'var(--clay)' }}>{error}</span>}
      </div>
    </div>
  );
}
