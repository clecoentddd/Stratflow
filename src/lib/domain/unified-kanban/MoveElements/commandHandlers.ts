import type { MoveElementCommand } from './commands';
import type { ElementMovedEvent } from '../events';
import { saveEvents } from '@/lib/db/event-store';
import { getKanbanProjection } from '../projection/projection';

// Handle element move - updates kanban projection only
export async function handleMoveElement(command: MoveElementCommand): Promise<void> {
  console.log('[UNIFIED KANBAN] Handling MoveElement command:', command);

  const { elementId, fromStatus, toStatus, boardId } = command;

  // Validate that the element exists in the projection
  const projection = getKanbanProjection();
  if (!projection[elementId]) {
    throw new Error(`Element ${elementId} not found in kanban projection`);
  }

  // Publish ElementMoved event (this will update the projection via the event handler)
  const event: ElementMovedEvent = {
    type: 'ElementMoved',
    entity: 'team',
    aggregateId: boardId || 'global',
    timestamp: new Date().toISOString(),
    payload: {
      elementId,
      fromStatus,
      toStatus,
      boardId,
    },
    metadata: {
      teamId: boardId,
    },
  };

  await saveEvents([event]);
  console.log('[UNIFIED KANBAN] ElementMoved event published:', event);
}