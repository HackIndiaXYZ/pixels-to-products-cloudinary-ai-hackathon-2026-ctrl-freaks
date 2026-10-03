import { NextResponse } from 'next/server';
import { checkPersistenceHealth } from '@/lib/cloudinary/persist';

export const dynamic = 'force-dynamic';

export async function GET() {
  const health = await checkPersistenceHealth();
  if (!health.ok) {
    return NextResponse.json(health, { status: 500 });
  }
  return NextResponse.json({ ok: true, details: health.details });
}
