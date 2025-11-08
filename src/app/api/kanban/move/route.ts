import { NextRequest, NextResponse } from 'next/server';
import { handleMoveElement } from '@/lib/domain/unified-kanban/commandHandlers';
import type { MoveElementCommand } from '@/lib/domain/unified-kanban/types';
// Import unified-kanban domain to register domain listeners
import '@/lib/domain/unified-kanban';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { elementId, fromStatus, toStatus, boardId } = body;

    console.log('[KANBAN MOVE API] Move request:', { elementId, fromStatus, toStatus, boardId });

    if (!elementId || !fromStatus || !toStatus) {
      return NextResponse.json(
        { error: 'Missing required fields: elementId, fromStatus, toStatus' },
        { status: 400 }
      );
    }

    // Create and execute move command
    const command: MoveElementCommand = {
      elementId,
      fromStatus,
      toStatus,
      boardId,
    };

    await handleMoveElement(command);

    console.log('[KANBAN MOVE API] Element moved successfully');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[KANBAN MOVE API] Move error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}