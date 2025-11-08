import type { MoveElementCommand } from './commands';
import type { ElementMovedEvent } from '../events';
import { saveEvents } from '@/lib/db/event-store';
import { getKanbanProjection } from '../projection/projection';

// Handle element move - updates kanban projection only
export async function handleMoveElement(command: MoveElementCommand): Promise<void> {
  console.log('[UNIFIED KANBAN] Handling MoveElement command:', command);

  const { elementId, toStatus, elementType } = command;

  // Instead of checking the in-memory projection, check the latest move event for this element
  // (In a real system, this would be an indexed query; here, we scan the event log)
  const { _getAllEvents } = await import('@/lib/db/event-store');
  const allEvents = await _getAllEvents();
  // Find the latest move event for this element
  const latestMove = [...allEvents]
    .reverse()
    .find(e =>
      e.type === 'ElementMoved' &&
      e.payload &&
      typeof e.payload === 'object' &&
      'elementId' in e.payload &&
      (e.payload as any).elementId === elementId &&
      'toStatus' in e.payload
    );

  if (latestMove && (latestMove.payload as any).toStatus === toStatus) {
    throw new Error(`Element ${elementId} is already in status ${toStatus}`);
  }

  // Build the new event structure
  const event: ElementMovedEvent = {
    type: 'ElementMoved',
    entity: elementType, // 'initiative' or 'item'
    aggregateId: elementId, // or use a boardId if you have one
    timestamp: new Date().toISOString(),
    payload: {
      elementId,
      elementType,
      toStatus,
      tags: ['kanban'],
    },
    metadata: {
      // Add any additional metadata if needed
    },
  };

  console.log('[UNIFIED KANBAN] About to append event:', event);
  await saveEvents([event]);
  console.log('[UNIFIED KANBAN] ElementMoved event published:', event);
}