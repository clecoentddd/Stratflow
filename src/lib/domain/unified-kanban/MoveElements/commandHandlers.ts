import type { MoveElementCommand } from './commands';
import type { ElementMovedEvent } from '../events';
import { saveEvents } from '@/lib/db/event-store';
import { getKanbanInitiativesProjection } from '../projection/kanban-initiatives-projection';
import { getKanbanInitiativeItemProjection } from '../projection/kanban-initiative-item-projection';

// Handle element move - updates kanban projection only
export async function handleMoveElement(command: MoveElementCommand): Promise<void> {
  console.log('[UNIFIED KANBAN] Handling MoveElement command:', command);

  const { elementId, toStatus, elementType } = command;

  const projection = elementType === 'initiative'
    ? getKanbanInitiativesProjection()
    : getKanbanInitiativeItemProjection();

  const existing = projection[elementId];

  if (existing) {
    console.log('[UNIFIED KANBAN] Projection lookup:', {
      elementId,
      currentStatus: existing.status,
      boardId: existing.boardId,
      updatedAt: existing.updatedAt,
    });
  } else {
    console.warn('[UNIFIED KANBAN] Projection lookup: element not found, will treat as first move', {
      elementId,
      toStatus,
    });
  }

  if (existing && existing.status === toStatus) {
    console.warn('[UNIFIED KANBAN] Move ignored: element already in target status', {
      elementId,
      toStatus,
    });
    return;
  }

  // Build the new event structure
  const eventMetadata: Record<string, any> = {};
  if (existing?.boardId) eventMetadata.boardId = existing.boardId;
  if (!eventMetadata.boardId && command.boardId) eventMetadata.boardId = command.boardId;
  if (existing?.teamId) eventMetadata.teamId = existing.teamId;
  if (existing?.addedAt) eventMetadata.addedAt = existing.addedAt;

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
      fromStatus: command.fromStatus,
      ...eventMetadata,
    },
  };

  console.log('[UNIFIED KANBAN] Prepared ElementMoved event payload:', event);
  await saveEvents([event]);
  console.log('[UNIFIED KANBAN] ElementMoved event persisted successfully for', elementId);
}