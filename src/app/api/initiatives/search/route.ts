import { NextRequest, NextResponse } from 'next/server';
import type { StrategyState } from '@/lib/types';
import '@/lib/domain/initiatives-catalog/projection';
import { queryEligibleInitiatives } from '@/lib/domain/initiatives-catalog/projection';
import { _getAllEvents, runProjectionOn } from '@/lib/db/event-store';
import { resetInitiativeCatalogProjection } from '@/lib/domain/initiatives-catalog/projection';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId') || undefined;
    const q = (searchParams.get('q') || '').toLowerCase();
    const excludeId = searchParams.get('excludeId') || undefined;
    const states = (searchParams.getAll('states') || []) as StrategyState[];
    console.log('[api/initiatives/search] params', { companyId, q, states });

    let rows = queryEligibleInitiatives({ states: (states.length ? states : ['Draft','Active']) as any });
    if (rows.length === 0) {
      // Fallback: this route may have a fresh module context; rebuild the catalog projection on the fly
      console.log('[api/initiatives/search] empty catalog in this context, rebuilding from events…');
      resetInitiativeCatalogProjection();
      const all = await _getAllEvents();
      all.forEach(ev => runProjectionOn(ev as any));
      rows = queryEligibleInitiatives({ states: (states.length ? states : ['Draft','Active']) as any });
      console.log('[api/initiatives/search] rebuilt catalog size', rows.length);
    }
    const filtered = rows.filter(r => (!q || r.name.toLowerCase().includes(q)) && (!excludeId || r.id !== excludeId));
    console.log('[api/initiatives/search] catalog size', { total: rows.length, filtered: filtered.length, excludeId });
    // For now, we only return minimal fields used by the dialog
    const results = filtered.map(r => ({
      initiativeId: r.id,
      name: r.name,
      strategyId: r.strategyId,
      strategyDescription: r.strategyName || '',
      teamId: r.teamId,
      teamName: r.teamName || r.teamId,
      teamLevel: typeof r.teamLevel === 'number' ? r.teamLevel : 0,
      state: (r.strategyState || 'Draft') as StrategyState,
    }));
    return NextResponse.json(results);
  } catch (e: any) {
    console.error('initiative search failed', e);
    return NextResponse.json([], { status: 200 });
  }
}
