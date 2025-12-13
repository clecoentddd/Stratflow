import { NextRequest, NextResponse } from 'next/server';
import { handleMoveElement } from '@/lib/domain/unified-kanban/MoveElements/commandHandlers';
import type { MoveElementCommand } from '@/lib/domain/unified-kanban/types';
// Import unified-kanban domain to register domain listeners
import '@/lib/domain/unified-kanban';

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(2, 8);
  console.log(`[KANBAN MOVE API] [${requestId}] Incoming POST /api/kanban/move`);
  try {
    const body = await request.json();
    console.log(`[KANBAN MOVE API] [${requestId}] Raw request body:`, body);
    const { elementId, fromStatus, toStatus, boardId, elementType } = body;
    console.log(`[KANBAN MOVE API] [${requestId}] Parsed payload:`, { elementId, fromStatus, toStatus, boardId, elementType });

    if (!elementId || !fromStatus || !toStatus || !elementType) {
      console.error(`[KANBAN MOVE API] [${requestId}] Missing required fields`, { elementId, fromStatus, toStatus, elementType });
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

    console.log(`[KANBAN MOVE API] [${requestId}] Dispatching handleMoveElement`, command);
    await handleMoveElement(command);

    console.log(`[KANBAN MOVE API] [${requestId}] Move completed successfully`);
    return NextResponse.json({ success: true, requestId });

  } catch (error) {
    console.error(`[KANBAN MOVE API] [${requestId}] Move error:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}