import Link from 'next/link';
import { listLeads, mensajesEnviadosHoy } from '@/lib/db';
import { Kanban } from '@/components/Kanban';

export const dynamic = 'force-dynamic';

const LIMIT = Number(process.env.DAILY_MESSAGE_LIMIT || 25);

export default function HomePage() {
  const leads = listLeads();
  const enviadosHoy = mensajesEnviadosHoy();
  const restantes = Math.max(0, LIMIT - enviadosHoy);
  const cerca = restantes <= 5;

  const activos = leads.filter((l) => l.estado !== 'descartado');

  return (
    <div className="reveal">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <div className="kicker"><span className="num">Vera</span> · Pipeline de captación</div>
          <h1 className="display" style={{ marginTop: '0.6rem' }}>
            Tus negocios, <span className="serif-italic" style={{ color: 'var(--clay)' }}>en movimiento</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Contador anti-baneo */}
          <div className="card" style={{ padding: '0.75rem 1.1rem', minWidth: 150 }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-2)' }}>Hoy</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', color: cerca ? 'var(--clay)' : 'var(--ink)' }}>
              {enviadosHoy}<span style={{ color: 'var(--ink-3)', fontSize: '1rem' }}> / {LIMIT}</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: cerca ? 'var(--clay)' : 'var(--ink-3)' }}>
              {cerca ? `¡Solo ${restantes} más! Cuida tu número` : `${restantes} envíos disponibles`}
            </div>
          </div>
          <Link href="/scraper" className="btn btn--clay">
            <span>Capturar leads</span>
            <span className="ic">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
            </span>
          </Link>
        </div>
      </div>

      {activos.length === 0 ? (
        <div className="panel" style={{ maxWidth: 560 }}>
          <div className="panel-in" style={{ textAlign: 'center' }}>
            <h2 className="h-lg" style={{ marginBottom: '0.5rem' }}>Aún no hay leads</h2>
            <p className="lead" style={{ margin: '0 auto 1.5rem', fontSize: '1rem' }}>
              Empieza capturando odontólogos o estéticas desde Google Maps.
            </p>
            <Link href="/scraper" className="btn btn--clay" style={{ margin: '0 auto' }}>
              <span>Ir al scraper</span>
              <span className="ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg></span>
            </Link>
          </div>
        </div>
      ) : (
        <Kanban initialLeads={leads} />
      )}
    </div>
  );
}
