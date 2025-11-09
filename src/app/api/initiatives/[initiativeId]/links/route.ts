import { NextRequest, NextResponse } from 'next/server';
import { saveEvents } from '@/lib/db/event-store';
import '@/lib/domain/initiatives-linking/projection'; // ensure handlers are registered when this route loads
import type { InitiativeLinkedEvent, InitiativeUnlinkedEvent } from '@/lib/domain/initiatives-linking/events';
import { getTeamsProjection } from '@/lib/domain/teams/projection';
import { linkInitiativesCommandHandler } from '@/lib/domain/initiatives-linking/linkInitiativesCommandHandler';
import type { LinkInitiativesCommand } from '@/lib/domain/initiatives-linking/LinkInitiativesCommand';
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
  // Log the structure for debugging
  console.warn('[API][links][findInitiativeContext] Initiative not found:', initiativeId);
  for (const team of list) {
    console.warn('  Team:', team.id, 'Level:', team.level);
    if (!team.dashboard || !Array.isArray(team.dashboard.strategies)) {
      console.warn('    No strategies found for this team.');
      continue;
    }
    for (const s of team.dashboard.strategies) {
  console.warn('    Strategy:', s.id, 'State:', s.state, 'Full object:', s);
      if (!Array.isArray(s.initiatives) || s.initiatives.length === 0) {
        console.warn('      No initiatives found for this strategy.');
        continue;
      }
      for (const i of s.initiatives) {
        console.warn('      Initiative:', i.id, 'Name:', i.name);
      }
    }
  }
  return null;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ initiativeId: string }> }) {
  try {
    console.log('[API][links][GET] called');
    const { initiativeId } = await ctx.params;
    console.log('[API][links][GET] initiativeId:', initiativeId);
    const { queryLinksFrom } = await import('@/lib/domain/initiatives-linking/projection');
    const rows = queryLinksFrom(initiativeId);
    console.log('[API][links][GET] rows:', rows);
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
    console.log('[API][links][GET] enriched:', enriched);
    return NextResponse.json(enriched);
  } catch (e) {
    console.error('[API][links][GET] error:', e);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ initiativeId: string }> }) {
  try {
    console.log('[API][links][POST] called');
    const { initiativeId } = await ctx.params;
    console.log('[API][links][POST] initiativeId:', initiativeId);
    const body = await req.json();
    console.log('[API][links][POST] body:', body);
    const targets: string[] = Array.isArray(body?.targets) ? body.targets : [];
    if (!targets.length) {
      console.warn('[API][links][POST] No targets provided');
      return NextResponse.json({ ok: false, message: 'No targets provided' }, { status: 400 });
    }

    const command: LinkInitiativesCommand = {
      fromInitiativeId: initiativeId,
      toInitiativeIds: targets,
      requestedBy: body?.requestedBy,
    };
    const { events, errors } = await linkInitiativesCommandHandler(command);
    if (errors.length) {
      console.warn('[API][links][POST] Command errors:', errors);
      return NextResponse.json({ ok: false, message: errors.join('; ') }, { status: 400 });
    }
    await saveEvents(events);
    console.log('[API][links][POST] events saved:', events);
    return NextResponse.json({ ok: true, count: events.length });
  } catch (e: any) {
    console.error('[API][links][POST] error:', e);
    return NextResponse.json({ ok: false, message: e?.message || 'Failed to link' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ initiativeId: string }> }) {
  try {
    console.log('[API][links][DELETE] called');
    const { initiativeId } = await ctx.params;
    console.log('[API][links][DELETE] initiativeId:', initiativeId);
    const body = await req.json();
    console.log('[API][links][DELETE] body:', body);
    const toId: string | undefined = body?.toInitiativeId;
    if (!toId) {
      console.warn('[API][links][DELETE] toInitiativeId required');
      return NextResponse.json({ ok: false, message: 'toInitiativeId required' }, { status: 400 });
    }

    const ev: InitiativeUnlinkedEvent = {
      type: 'InitiativeUnlinked',
      entity: 'team',
      aggregateId: initiativeId,
      timestamp: new Date().toISOString(),
      payload: { fromInitiativeId: initiativeId, toInitiativeId: toId },
    };
    await saveEvents([ev]);
    console.log('[API][links][DELETE] event saved:', ev);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[API][links][DELETE] error:', e);
    return NextResponse.json({ ok: false, message: e?.message || 'Failed to unlink' }, { status: 400 });
  }
}
