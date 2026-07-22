'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { Lead, Estado, Temperatura, Categoria } from '@/lib/db';

const COLUMNAS: { estado: Estado; label: string }[] = [
  { estado: 'nuevo', label: 'Nuevo' },
  { estado: 'contactado', label: 'Contactado' },
  { estado: 'respondio', label: 'Respondió' },
  { estado: 'interesado', label: 'Interesado' },
  { estado: 'cerrado', label: 'Cerrado' },
];

const TEMP_ICON: Record<Temperatura, string> = { frio: '❄️', tibio: '🌡️', caliente: '🔥' };

function LeadCard({ lead, dragging }: { lead: Lead; dragging?: boolean }) {
  return (
    <div className="lead-card" style={dragging ? { opacity: 0.4 } : undefined}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 8 }}>
        <span style={{ fontFamily: 'var(--serif)', fontSize: '1.02rem', lineHeight: 1.15 }}>{lead.nombre}</span>
        <span title={lead.temperatura} style={{ fontSize: '0.95rem' }}>{TEMP_ICON[lead.temperatura]}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        {lead.categoria && (
          <span className="tag" style={{ fontSize: '0.66rem', padding: '0.2rem 0.5rem' }}>
            {lead.categoria === 'odontologo' ? 'Odontología' : 'Estética'}
          </span>
        )}
        {lead.rating != null && (
          <span className="tag" style={{ fontSize: '0.66rem', padding: '0.2rem 0.5rem' }}>★ {lead.rating}</span>
        )}
        {lead.demo_url && (
          <span className="tag" style={{ fontSize: '0.66rem', padding: '0.2rem 0.5rem', color: 'var(--sage)' }}>demo ✓</span>
        )}
        {/* Señal de alta intención: abrió la demo (pixel de seguimiento). */}
        {lead.aperturas > 0 && (
          <span className="tag" style={{ fontSize: '0.66rem', padding: '0.2rem 0.5rem', color: '#fff', background: 'var(--clay)', borderColor: 'var(--clay)', fontWeight: 600 }}>
            👀 abrió{lead.aperturas > 1 ? ` ×${lead.aperturas}` : ''}
          </span>
        )}
        {/* Targeting: sin web propia = candidato ideal del pitch (resaltado);
            con web = menos prioritario (tag tenue). */}
        {!lead.sitio_web ? (
          <span className="tag" style={{ fontSize: '0.66rem', padding: '0.2rem 0.5rem', color: 'var(--clay)', borderColor: 'var(--clay)', fontWeight: 600 }}>◆ sin web</span>
        ) : (
          <span className="tag" style={{ fontSize: '0.66rem', padding: '0.2rem 0.5rem', color: 'var(--ink-3)' }}>tiene web</span>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--ink-3)' }}>{lead.telefono || 'sin teléfono'}</span>
        <Link href={`/leads/${lead.id}`} style={{ fontSize: '0.76rem', color: 'var(--clay)', fontWeight: 600 }} onClick={(e) => e.stopPropagation()}>
          Ver →
        </Link>
      </div>
    </div>
  );
}

function DraggableCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={{ touchAction: 'none' }}>
      <LeadCard lead={lead} dragging={isDragging} />
    </div>
  );
}

function Column({ estado, label, leads }: { estado: Estado; label: string; leads: Lead[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: estado });
  return (
    <div ref={setNodeRef} className={`kanban-col ${isOver ? 'drop-on' : ''}`}>
      <div className="kanban-col-head">
        <span className="t">{label}</span>
        <span className="c">{leads.length}</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {leads.map((l) => <DraggableCard key={l.id} lead={l} />)}
        {!leads.length && <p style={{ fontSize: '0.78rem', color: 'var(--ink-3)', padding: '0.5rem' }}>—</p>}
      </div>
    </div>
  );
}

export function Kanban({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [fCat, setFCat] = useState<Categoria | ''>('');
  const [fTemp, setFTemp] = useState<Temperatura | ''>('');
  const [fSinWeb, setFSinWeb] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const visibles = useMemo(
    () =>
      leads.filter(
        (l) =>
          l.estado !== 'descartado' &&
          (!fCat || l.categoria === fCat) &&
          (!fTemp || l.temperatura === fTemp) &&
          (!fSinWeb || !l.sitio_web)
      ),
    [leads, fCat, fTemp, fSinWeb]
  );

  const activeLead = leads.find((l) => l.id === activeId) || null;

  function onDragStart(e: DragStartEvent) {
    setActiveId(Number(e.active.id));
  }

  async function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const id = Number(e.active.id);
    const nuevoEstado = e.over?.id as Estado | undefined;
    if (!nuevoEstado) return;
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.estado === nuevoEstado) return;

    // Optimista
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, estado: nuevoEstado } : l)));
    try {
      await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
    } catch {
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, estado: lead.estado } : l)));
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
        <select className="field" style={{ width: 'auto' }} value={fCat} onChange={(e) => setFCat(e.target.value as Categoria | '')}>
          <option value="">Todas las categorías</option>
          <option value="odontologo">Odontología</option>
          <option value="estetica">Estética</option>
        </select>
        <select className="field" style={{ width: 'auto' }} value={fTemp} onChange={(e) => setFTemp(e.target.value as Temperatura | '')}>
          <option value="">Toda temperatura</option>
          <option value="caliente">🔥 Caliente</option>
          <option value="tibio">🌡️ Tibio</option>
          <option value="frio">❄️ Frío</option>
        </select>
        {/* Targeting: aísla los candidatos ideales (sin web propia). */}
        <button
          type="button"
          className="tag"
          onClick={() => setFSinWeb((v) => !v)}
          aria-pressed={fSinWeb}
          style={{
            cursor: 'pointer', padding: '0.4rem 0.75rem', fontSize: '0.8rem', fontWeight: 600,
            color: fSinWeb ? '#fff' : 'var(--clay)', borderColor: 'var(--clay)',
            background: fSinWeb ? 'var(--clay)' : 'transparent',
          }}
        >
          ◆ Solo sin web
        </button>
        <span style={{ fontSize: '0.82rem', color: 'var(--ink-3)', marginLeft: 'auto' }}>
          {visibles.length} leads visibles
        </span>
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="kanban">
          {COLUMNAS.map((c) => (
            <Column key={c.estado} estado={c.estado} label={c.label} leads={visibles.filter((l) => l.estado === c.estado)} />
          ))}
        </div>
        <DragOverlay>{activeLead ? <LeadCard lead={activeLead} /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}
