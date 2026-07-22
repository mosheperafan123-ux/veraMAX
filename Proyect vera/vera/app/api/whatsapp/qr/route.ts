import { NextResponse } from 'next/server';
import { getQr } from '@/lib/evolution';

export const dynamic = 'force-dynamic';

// GET /api/whatsapp/qr — devuelve el QR en vivo (o estado conectado).
export async function GET() {
  const qr = await getQr();
  return NextResponse.json(qr);
}
