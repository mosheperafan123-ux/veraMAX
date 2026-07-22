'use client';

import { useEffect, useState, useCallback } from 'react';

interface Qr { conectado: boolean; base64?: string; pairingCode?: string; error?: string }

export default function WhatsappPage() {
  const [qr, setQr] = useState<Qr | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ enviadosHoy: number; limite: number } | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [q, s] = await Promise.all([
        fetch('/api/whatsapp/qr', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/whatsapp', { cache: 'no-store' }).then((r) => r.json()),
      ]);
      setQr(q);
      setStatus({ enviadosHoy: s.enviadosHoy, limite: s.limite });
    } catch {
      setQr({ conectado: false, error: 'No se pudo contactar Evolution. ¿Está Docker arriba?' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    // Auto-refresh: los QR de WhatsApp expiran ~cada 30s.
    const id = setInterval(refresh, 20000);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <div className="reveal" style={{ maxWidth: 720 }}>
      <div className="kicker"><span className="num">WhatsApp</span> · Conexión</div>
      <h1 className="display" style={{ marginTop: '0.6rem', marginBottom: '1.5rem' }}>
        Conecta tu <span className="serif-italic" style={{ color: 'var(--clay)' }}>WhatsApp</span>
      </h1>

      <div className="panel">
        <div className="panel-in" style={{ textAlign: 'center' }}>
          {loading ? (
            <p className="muted">Cargando…</p>
          ) : qr?.conectado ? (
            <div>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
              <h2 className="h-lg" style={{ marginBottom: '0.5rem' }}>¡Conectado!</h2>
              <p className="lead" style={{ margin: '0 auto', fontSize: '1rem' }}>
                Tu número está vinculado. Ya puedes enviar demos por WhatsApp desde el detalle de cada lead.
              </p>
            </div>
          ) : qr?.base64 ? (
            <div>
              <h2 className="h-lg" style={{ marginBottom: '0.75rem' }}>Escanea este código</h2>
              <p className="muted" style={{ marginBottom: '1.25rem', fontSize: '0.92rem' }}>
                En tu WhatsApp (número dedicado): <strong>Dispositivos vinculados → Vincular un dispositivo</strong>.
                El código se refresca solo cada 20s.
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr.base64} alt="QR de WhatsApp" width={280} height={280}
                style={{ margin: '0 auto', borderRadius: 'var(--r-md)', border: '1px solid var(--line)', background: '#fff', padding: 8 }} />
              {qr.pairingCode && (
                <p style={{ marginTop: '1rem', fontSize: '0.82rem', color: 'var(--ink-3)' }}>
                  ¿No puedes escanear? Código de emparejamiento disponible vía API.
                </p>
              )}
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
              <p className="lead" style={{ margin: '0 auto', fontSize: '1rem' }}>
                {qr?.error
                  ? `No hay QR todavía: ${qr.error}`
                  : 'Generando código… Asegúrate de que Docker y Evolution estén arriba (docker compose up -d).'}
              </p>
              <button className="btn-line" style={{ marginTop: '1.25rem' }} onClick={refresh}>Reintentar</button>
            </div>
          )}
        </div>
      </div>

      {status && (
        <p style={{ marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--ink-3)', textAlign: 'center' }}>
          Mensajes enviados hoy: {status.enviadosHoy} / {status.limite}
        </p>
      )}
    </div>
  );
}
