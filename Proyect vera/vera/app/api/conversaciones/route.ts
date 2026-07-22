import { NextResponse } from 'next/server';
import { listConversaciones } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/conversaciones — lista de chats para la bandeja (auto-refresh).
export async function GET() {
  return NextResponse.json({ conversaciones: listConversaciones() });
}
