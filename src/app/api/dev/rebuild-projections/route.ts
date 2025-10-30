import { NextResponse } from 'next/server';
import { _getAllEvents, runProjectionOn } from '@/lib/db/event-store';
import '@/lib/domain/initiatives/linking/projection';
import { resetInitiativeLinksProjection } from '@/lib/domain/initiatives/linking/projection';
import '@/lib/domain/initiatives/catalog/projection';
import { resetInitiativeCatalogProjection } from '@/lib/domain/initiatives/catalog/projection';

export async function POST() {
  try {
    resetInitiativeLinksProjection();
    resetInitiativeCatalogProjection();

    const events = await _getAllEvents();
    for (const e of events) {
      runProjectionOn(e);
    }

    return NextResponse.json({ ok: true, replayed: events.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message || 'Failed to rebuild projections' }, { status: 500 });
  }
}
