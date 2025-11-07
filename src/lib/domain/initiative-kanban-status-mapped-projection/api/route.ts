import { emptyKanbanProjection, rebuildKanbanProjection, queryKanbanBoard } from '../kanbanProjection';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    console.log('[KANBAN API] GET request received');
    const data = queryKanbanBoard();
    console.log('[KANBAN API] Returning data:', data.map(d => ({ teamId: d.teamId, itemCount: d.items.length })));
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[KANBAN API] GET error:', error);
    return new Response(JSON.stringify({ status: 'error', error: (error as Error).message }), { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    console.log('[KANBAN API] DELETE request received - emptying projection');
    await emptyKanbanProjection();
    console.log('[KANBAN API] Projection emptied successfully');
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('[KANBAN API] DELETE error:', error);
    return NextResponse.json({ status: 'error', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('[KANBAN API] POST request received - rebuilding projection');
    await rebuildKanbanProjection();
    console.log('[KANBAN API] Projection rebuilt successfully');
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('[KANBAN API] POST error:', error);
    return NextResponse.json({ status: 'error', error: (error as Error).message }, { status: 500 });
  }
}
