import { NextRequest, NextResponse } from 'next/server';
import { handleMoveElement } from '@/lib/domain/unified-kanban/MoveElements/commandHandlers';
import type { MoveElementCommand } from '@/lib/domain/unified-kanban/types';
// Import unified-kanban domain to register domain listeners
import '@/lib/domain/unified-kanban';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[KANBAN MOVE API] Raw request body:', body);
    const { elementId, fromStatus, toStatus, boardId, elementType } = body;
    console.log('[KANBAN MOVE API] Parsed fields:', { elementId, fromStatus, toStatus, boardId, elementType });

    if (!elementId || !fromStatus || !toStatus || !elementType) {
      console.error('[KANBAN MOVE API] Missing required fields:', { elementId, fromStatus, toStatus, elementType });
      return NextResponse.json(
        { error: 'Missing required fields: elementId, fromStatus, toStatus, elementType' },
        { status: 400 }
      );
    }

    // Create and execute move command
    const command: MoveElementCommand = {
      elementId,
      fromStatus,
      toStatus,
      elementType,
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