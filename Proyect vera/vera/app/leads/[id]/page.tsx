import { notFound } from 'next/navigation';
import { getLead, listMensajes } from '@/lib/db';
import { demoUrlFor } from '@/lib/messages';
import { LeadDetail } from '@/components/LeadDetail';

export const dynamic = 'force-dynamic';

export default function LeadPage({ params }: { params: { id: string } }) {
  const lead = getLead(Number(params.id));
  if (!lead) notFound();
  const mensajes = listMensajes(lead.id);
  // URL pública del demo (GitHub Pages si el hosting está configurado; si no, la
  // local). demoUrlFor lee process.env en el servidor → el cliente no puede.
  const publicDemoUrl = lead.demo_url ? demoUrlFor(lead) : null;
  return <LeadDetail initialLead={lead} initialMensajes={mensajes} publicDemoUrl={publicDemoUrl} />;
}
