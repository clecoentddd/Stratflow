import { getKanbanBoardForTeam } from '@/lib/domain/initiative-kanban-status-mapped-projection/kanbanProjection';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    console.log('[KANBAN API] 🔍 ROOT CAUSE: GET /team/[teamId] request received for teamId:', teamId);

    if (!teamId) {
      console.error('[KANBAN API] Missing teamId parameter');
      return NextResponse.json({ error: 'Missing teamId parameter' }, { status: 400 });
    }

    console.log('[KANBAN API] 🔍 ROOT CAUSE: Calling getKanbanBoardForTeam server-side for teamId:', teamId);
    const data = await getKanbanBoardForTeam(teamId);

    console.log('[KANBAN API] 🔍 ROOT CAUSE: Raw data from projection for team', teamId, ':', JSON.stringify(data, null, 2));
    console.log('[KANBAN API] 🔍 ROOT CAUSE: Data array length:', data.length);
    console.log('[KANBAN API] 🔍 ROOT CAUSE: Items breakdown by status:');
    const statusCounts = data.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('[KANBAN API] 🔍 ROOT CAUSE: Status counts:', statusCounts);

    console.log('[KANBAN API] ✅ Successfully retrieved kanban data for team:', teamId, 'items:', data.length);
    console.log('[KANBAN API] 🔍 ROOT CAUSE: Returning data:', JSON.stringify(data, null, 2));

    return NextResponse.json(data);
  } catch (error) {
    console.error('[KANBAN API] GET /team/[teamId] error for teamId:', (await params).teamId, error);
    return NextResponse.json(
      { error: 'Failed to fetch kanban board', details: (error as Error).message },
      { status: 500 }
    );
  }
}