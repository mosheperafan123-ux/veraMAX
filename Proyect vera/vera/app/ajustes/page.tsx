import { getAjustes } from '@/lib/antiban';
import { listarRespaldos, respaldoDiarioSiHaceFalta } from '@/lib/backup';
import { AjustesForm } from '@/components/Ajustes';
import { Respaldos } from '@/components/Respaldos';

export const dynamic = 'force-dynamic';

export default function AjustesPage() {
  const ajustes = getAjustes();
  // Auto-respaldo: al abrir el panel, crea uno si aún no hay de hoy (no bloquea ni lanza).
  respaldoDiarioSiHaceFalta();
  const respaldos = listarRespaldos();
  return (
    <div className="reveal">
      <div style={{ marginBottom: '1.75rem' }}>
        <div className="kicker"><span className="num">Vera</span> · No quemar el número</div>
        <h1 className="display" style={{ marginTop: '0.6rem' }}>
          Ajustes de <span className="serif-italic" style={{ color: 'var(--clay)' }}>envío</span>
        </h1>
        <p className="lead" style={{ marginTop: '0.6rem', maxWidth: 560, fontSize: '1rem' }}>
          Controla cuándo y cuánto envía Vera para proteger tu WhatsApp. Aplica a los mensajes iniciales y a los seguimientos.
        </p>
      </div>
      <AjustesForm initial={ajustes} />
      <div style={{ marginTop: '1rem' }}>
        <Respaldos initial={respaldos} />
      </div>
    </div>
  );
}
