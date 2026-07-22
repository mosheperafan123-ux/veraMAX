import { listConversaciones } from '@/lib/db';
import { Chat } from '@/components/Chat';

export const dynamic = 'force-dynamic';

export default function InboxPage() {
  const conversations = listConversaciones();
  const testMode = process.env.TEST_MODE === 'true';
  const testPhone = testMode ? (process.env.TEST_PHONE || null) : null;
  const sinLeer = conversations.filter((c) => c.sinLeer).length;

  return (
    <div className="reveal" style={{ height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div className="kicker"><span className="num">Respuestas</span> · Tu WhatsApp</div>
          <h1 className="display" style={{ marginTop: '0.5rem', fontSize: 'clamp(1.8rem,4vw,2.6rem)' }}>
            Conversaciones {sinLeer > 0 && <span className="serif-italic" style={{ color: 'var(--clay)' }}>· {sinLeer} sin responder</span>}
          </h1>
        </div>
        {testMode && (
          <span style={{ fontSize: '0.74rem', color: 'var(--gold)', fontWeight: 600, border: '1px solid var(--gold)', borderRadius: 999, padding: '0.3rem 0.8rem' }}>
            🧪 MODO PRUEBA
          </span>
        )}
      </div>

      <Chat conversations={conversations} testMode={testMode} testPhone={testPhone} />
    </div>
  );
}
