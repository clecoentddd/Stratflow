import { NextRequest } from 'next/server';
import { handleMoveElement } from '@/lib/domain/unified-kanban/MoveElements/commandHandlers';
import type { MoveElementCommand } from '@/lib/domain/unified-kanban/types';
import '@/lib/domain/unified-kanban';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/response';

export async function PATCH(
    request: NextRequest,
    { params }: { params: { itemId: string } | Promise<{ itemId: string }> }
) {
    const requestId = Math.random().toString(36).substring(2, 8);
    console.log(`[KANBAN ITEM PATCH] [${requestId}] Incoming PATCH /api/kanban/items/[itemId]`);

    try {
        const { itemId } = (await params) as { itemId: string };
        const body = await request.json();
        console.log(`[KANBAN ITEM PATCH] [${requestId}] Raw request body:`, body);

        const { fromStatus, toStatus, boardId, elementType } = body;
        console.log(`[KANBAN ITEM PATCH] [${requestId}] Parsed payload:`, { itemId, fromStatus, toStatus, boardId, elementType });

        if (!itemId || !fromStatus || !toStatus || !elementType) {
            return errorResponse('Missing required fields: fromStatus, toStatus, elementType', 400);
        }

        const command: MoveElementCommand = {
            elementId: itemId,
            fromStatus,
            toStatus,
            elementType,
            boardId,
        };

        console.log(`[KANBAN ITEM PATCH] [${requestId}] Dispatching handleMoveElement`, command);
        await handleMoveElement(command);

        console.log(`[KANBAN ITEM PATCH] [${requestId}] Move completed successfully`);
        return successResponse({ success: true, requestId });

    } catch (error) {
        console.error(`[KANBAN ITEM PATCH] [${requestId}] Move error:`, error);
        return handleApiError(error);
    }
}
