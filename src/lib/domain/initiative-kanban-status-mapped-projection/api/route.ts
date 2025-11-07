import { emptyKanbanProjection, rebuildKanbanProjection, queryKanbanBoard } from '../kanbanProjection';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    console.log('[KANBAN API] 📊 GET /api/initiative-kanban-status-mapped-projection/projection (ALL TEAMS)');
    console.log('[KANBAN API] 🎯 Projection Slice: Handling request for all teams data');
    const data = await queryKanbanBoard();
    console.log('[KANBAN API] ✅ Projection Slice: Returning all teams data:', data.map(d => ({ teamId: d.teamId, itemCount: d.items.length })));
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[KANBAN API] ❌ GET /api/initiative-kanban-status-mapped-projection/projection error:', error);
    return new Response(JSON.stringify({ status: 'error', error: (error as Error).message }), { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    console.log('[KANBAN API] 🗑️ DELETE /api/initiative-kanban-status-mapped-projection/projection - emptying projection');
    console.log('[KANBAN API] 🎯 Projection Slice: Emptying all kanban data');
    await emptyKanbanProjection();
    console.log('[KANBAN API] ✅ Projection Slice: Kanban data emptied successfully');
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('[KANBAN API] ❌ DELETE /api/initiative-kanban-status-mapped-projection/projection error:', error);
    return NextResponse.json({ status: 'error', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('[KANBAN API] 🔄 POST /api/initiative-kanban-status-mapped-projection/projection - rebuilding projection');
    console.log('[KANBAN API] 🎯 Projection Slice: Rebuilding kanban projection from events');
    await rebuildKanbanProjection();
    console.log('[KANBAN API] ✅ Projection Slice: Kanban projection rebuilt successfully');
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('[KANBAN API] ❌ POST /api/initiative-kanban-status-mapped-projection/projection error:', error);
    return NextResponse.json({ status: 'error', error: (error as Error).message }, { status: 500 });
  }
}
