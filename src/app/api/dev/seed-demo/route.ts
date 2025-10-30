import { NextResponse } from 'next/server';
import { seedDemoCompany } from '@/lib/db/event-store';

export async function POST() {
  try {
    const result = seedDemoCompany();
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message || 'Failed to seed demo' }, { status: 500 });
  }
}
