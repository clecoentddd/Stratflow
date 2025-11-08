import { registerProjectionHandler } from '@/lib/db/event-store';
import { saveEvents } from '@/lib/db/event-store';
import type { ElementAddedToKanbanEvent } from './events';

// Domain listeners that add elements to kanban projection when they are created

// Listen for initiative creation and add to kanban
registerProjectionHandler('InitiativeCreated', async (event: any) => {
  if (event.type !== 'InitiativeCreated') return;

  console.log('[KANBAN LISTENER] Processing InitiativeCreated event:', event);

  const initiativeId = event.metadata?.initiativeId;
  const teamId = event.aggregateId;

  if (!initiativeId || !teamId) {
    console.warn('[KANBAN LISTENER] Missing initiativeId or teamId in InitiativeCreated event');
    return;
  }

  // Add initiative to kanban projection with "NEW" status
  const kanbanEvent: ElementAddedToKanbanEvent = {
    type: 'ElementAddedToKanban',
    entity: 'team',
    aggregateId: teamId,
    timestamp: new Date().toISOString(),
    payload: {
      elementId: `initiative-${initiativeId}`,
      elementType: 'initiative',
      initialStatus: 'NEW',
      boardId: teamId, // Use teamId as board identifier
    },
    metadata: {
      teamId,
    },
  };

  await saveEvents([kanbanEvent]);
  console.log('[KANBAN LISTENER] Added initiative to kanban projection:', kanbanEvent.payload);
});

// Listen for initiative item creation and add to kanban
registerProjectionHandler('InitiativeItemAdded', async (event: any) => {
  if (event.type !== 'InitiativeItemAdded') return;

  console.log('[KANBAN LISTENER] Processing InitiativeItemAdded event:', event);

  const itemId = event.metadata?.itemId;
  const teamId = event.aggregateId;

  if (!itemId || !teamId) {
    console.warn('[KANBAN LISTENER] Missing itemId or teamId in InitiativeItemAdded event');
    return;
  }

  // Add item to kanban projection with "NEW" status
  const kanbanEvent: ElementAddedToKanbanEvent = {
    type: 'ElementAddedToKanban',
    entity: 'team',
    aggregateId: teamId,
    timestamp: new Date().toISOString(),
    payload: {
      elementId: `item-${itemId}`,
      elementType: 'initiative-item',
      initialStatus: 'NEW',
      boardId: teamId, // Use teamId as board identifier
    },
    metadata: {
      teamId,
    },
  };

  await saveEvents([kanbanEvent]);
  console.log('[KANBAN LISTENER] Added initiative item to kanban projection:', kanbanEvent.payload);
});

console.log('[DOMAIN LISTENERS] Registered creation event listeners for kanban projection');