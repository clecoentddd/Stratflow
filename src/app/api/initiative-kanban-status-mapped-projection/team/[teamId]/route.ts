import { getKanbanBoardForTeam } from '@/lib/domain/initiative-kanban-status-mapped-projection/kanbanProjection';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    console.log('[KANBAN API] GET /team/[teamId] request received for teamId:', params.teamId);

    const teamId = params.teamId;
    if (!teamId) {
      console.error('[KANBAN API] Missing teamId parameter');
      return NextResponse.json({ error: 'Missing teamId parameter' }, { status: 400 });
    }

    console.log('[KANBAN API] Calling getKanbanBoardForTeam server-side for teamId:', teamId);
    const data = await getKanbanBoardForTeam(teamId);

    console.log('[KANBAN API] ✅ Successfully retrieved kanban data for team:', teamId, 'items:', data.length);
    console.log('[KANBAN API] Returning data:', JSON.stringify(data, null, 2));

    return NextResponse.json(data);
  } catch (error) {
    console.error('[KANBAN API] GET /team/[teamId] error for teamId:', params.teamId, error);
    return NextResponse.json(
      { error: 'Failed to fetch kanban board', details: (error as Error).message },
      { status: 500 }
    );
  }
}