import { NextRequest, NextResponse } from 'next/server';
import { saveEvents } from '@/lib/db/event-store';
import '@/lib/domain/initiatives/linking/projection'; // ensure handlers are registered when this route loads
import type { InitiativeLinkedEvent, InitiativeUnlinkedEvent } from '@/lib/domain/initiatives/linking/events';
import { getTeamsProjection } from '@/lib/db/projections';
import type { Strategy, Team } from '@/lib/types';

function findInitiativeContext(initiativeId: string, teams: Team | Team[]): { teamId: string; teamLevel: number; strategyId: string; strategyState: string } | null {
  const list = Array.isArray(teams) ? teams : [teams];
  for (const team of list) {
    for (const s of team.dashboard.strategies) {
      for (const i of s.initiatives) {
        if (i.id === initiativeId) {
          return { teamId: team.id, teamLevel: team.level, strategyId: s.id, strategyState: s.state };
        }
      }
    }
  }
  return null;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ initiativeId: string }> }) {
  try {
    const { initiativeId } = await ctx.params;
    const { queryLinksFrom } = await import('@/lib/domain/initiatives/linking/projection');
    const rows = queryLinksFrom(initiativeId);
    const teams = await getTeamsProjection();
    const enriched = rows.map(r => {
      const toCtx = findInitiativeContext(r.toInitiativeId, teams);
      const toName = (() => {
        for (const team of teams) {
          for (const s of team.dashboard.strategies) {
            const found = s.initiatives.find(i => i.id === r.toInitiativeId);
            if (found) return found.name;
          }
        }
        return r.toInitiativeId;
      })();
      return {
        ...r,
        toInitiativeName: toName,
        toStrategyId: toCtx?.strategyId,
        toTeamId: toCtx?.teamId,
        toTeamLevel: toCtx?.teamLevel,
      };
    });
    return NextResponse.json(enriched);
  } catch (e) {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ initiativeId: string }> }) {
  try {
    const { initiativeId } = await ctx.params;
    const body = await req.json();
    const targets: string[] = Array.isArray(body?.targets) ? body.targets : [];
    if (!targets.length) return NextResponse.json({ ok: false, message: 'No targets provided' }, { status: 400 });

    const teams = await getTeamsProjection();
    const fromCtx = findInitiativeContext(initiativeId, teams);
    if (!fromCtx) return NextResponse.json({ ok: false, message: 'Source initiative not found' }, { status: 404 });
    if (!['Draft', 'Active'].includes(fromCtx.strategyState)) return NextResponse.json({ ok: false, message: 'Source strategy must be Draft or Active' }, { status: 400 });

    const events: (InitiativeLinkedEvent)[] = [];
    for (const toId of targets) {
      const toCtx = findInitiativeContext(toId, teams);
      if (!toCtx) continue;
      if (!['Draft', 'Active'].includes(toCtx.strategyState)) continue;
      if (toId === initiativeId) continue;
      const ev: InitiativeLinkedEvent = {
        type: 'InitiativeLinked',
        entity: 'team',
        aggregateId: fromCtx.teamId,
        timestamp: new Date().toISOString(),
        payload: {
          fromInitiativeId: initiativeId,
          toInitiativeId: toId,
          fromStrategyId: fromCtx.strategyId,
          toStrategyId: toCtx.strategyId,
          fromTeamId: fromCtx.teamId,
          toTeamId: toCtx.teamId,
          fromTeamLevel: fromCtx.teamLevel,
          toTeamLevel: toCtx.teamLevel,
        },
      };
      events.push(ev);
    }

    if (!events.length) return NextResponse.json({ ok: false, message: 'No valid targets' }, { status: 400 });

    await saveEvents(events);
    return NextResponse.json({ ok: true, count: events.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message || 'Failed to link' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ initiativeId: string }> }) {
  try {
    const { initiativeId } = await ctx.params;
    const body = await req.json();
    const toId: string | undefined = body?.toInitiativeId;
    if (!toId) return NextResponse.json({ ok: false, message: 'toInitiativeId required' }, { status: 400 });

    const ev: InitiativeUnlinkedEvent = {
      type: 'InitiativeUnlinked',
      entity: 'team',
      aggregateId: initiativeId,
      timestamp: new Date().toISOString(),
      payload: { fromInitiativeId: initiativeId, toInitiativeId: toId },
    };
    await saveEvents([ev]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message || 'Failed to unlink' }, { status: 400 });
  }
}
