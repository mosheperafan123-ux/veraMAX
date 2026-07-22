import { seguimientosPendientes } from '@/lib/followups';
import { Seguimientos } from '@/components/Seguimientos';

export const dynamic = 'force-dynamic';

export default function SeguimientosPage() {
  const pendientes = seguimientosPendientes();
  const testMode = process.env.TEST_MODE === 'true';
  const testPhone = testMode ? (process.env.TEST_PHONE || null) : null;
  const horas = Number(process.env.FOLLOWUP_HOURS || 48);
  const max = Number(process.env.FOLLOWUP_MAX || 2);

  return (
    <div className="reveal">
      <div className="kicker"><span className="num">Seguimientos</span> · Reactivar leads</div>
      <h1 className="display" style={{ marginTop: '0.6rem', marginBottom: '0.4rem' }}>
        Recordatorios <span className="serif-italic" style={{ color: 'var(--clay)' }}>pendientes</span>
      </h1>
      <p style={{ color: 'var(--ink-3)', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
        Cadencia actual: recordatorio cada {horas}h sin respuesta · máximo {max} por lead.
      </p>

      <Seguimientos initial={pendientes} testMode={testMode} testPhone={testPhone} />
    </div>
  );
}
