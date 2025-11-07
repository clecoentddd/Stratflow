import type { KanbanBoardItem, KanbanStatus } from './types';
import { registerProjectionHandler } from '@/lib/db/event-store';
import { _getAllEvents } from '@/lib/db/event-store';
import type { InitiativeItemAddedEvent, InitiativeItemUpdatedEvent, InitiativeItemDeletedEvent } from '@/lib/domain/initiative-items/events';
import type { ItemKanbanStatusMappedEvent } from '@/lib/domain/initiative-kanban-status-mapped-event/events';

// In-memory projection (replace with persistent store as needed)
const kanbanBoard: Record<string, KanbanBoardItem[]> = {};
let _projectionBuilt = false;

const KANBAN_STEP_KEYS = ['actions', 'proximateObjectives'];

console.log('[KANBAN PROJECTION] Module loaded, registering handlers');

// Register event handlers
registerProjectionHandler('InitiativeItemAdded', (event: any) => {
  console.log('[KANBAN PROJECTION] 📥 HANDLER: InitiativeItemAdded handler invoked', {
    eventType: event.type,
    hasPayload: !!event.payload,
    hasMetadata: !!event.metadata
  });
  if (event.type !== 'InitiativeItemAdded') return;

  const { stepKey, item } = event.payload || {};
  const meta = event.metadata as { initiativeId: string; itemId: string; teamId?: string };
  const initiativeId = meta?.initiativeId;
  const itemId = meta?.itemId;
  const teamId = meta?.teamId || 'unknown';

  console.log('[KANBAN PROJECTION] 📥 HANDLER: Processing InitiativeItemAdded:', {
    stepKey,
    initiativeId,
    itemId,
    teamId,
    itemText: item?.text,
    itemKeys: item ? Object.keys(item) : []
  });

  if (!initiativeId || !itemId) {
    console.warn('[KANBAN PROJECTION] ❌ HANDLER: Missing initiativeId or itemId:', { initiativeId, itemId });
    return;
  }

  if (!teamId || teamId === 'unknown') {
    console.warn('[KANBAN PROJECTION] ❌ HANDLER: Missing or unknown teamId:', { teamId });
    return;
  }

  if (!KANBAN_STEP_KEYS.includes(stepKey)) {
    console.log('[KANBAN PROJECTION] ⏭️ HANDLER: Skipping non-kanban step:', { stepKey, validSteps: KANBAN_STEP_KEYS });
    return;
  }

  console.log('[KANBAN PROJECTION] ✅ HANDLER: Adding item to kanban board:', { teamId, itemId, initiativeId });

  if (!kanbanBoard[teamId]) {
    kanbanBoard[teamId] = [];
    console.log('[KANBAN PROJECTION] 🆕 HANDLER: Created new team array for:', teamId);
  }

  const newItem: KanbanBoardItem = {
    itemId,
    initiativeId,
    teamId,
    name: '',
    text: item?.text || '',
    status: 'ToDo' as KanbanStatus,
  };

  kanbanBoard[teamId].push(newItem);

  console.log('[KANBAN PROJECTION] ✅ HANDLER: Added item to kanbanBoard:', {
    teamId,
    itemId,
    initiativeId,
    text: item?.text,
    newItemCount: kanbanBoard[teamId].length
  });
  console.log('[KANBAN PROJECTION] 📊 HANDLER: Current board state:', Object.keys(kanbanBoard).map(teamId => ({ teamId, count: kanbanBoard[teamId].length })));
});

registerProjectionHandler('InitiativeItemUpdated', (event: any) => {
  console.log('[KANBAN PROJECTION] 📥 HANDLER: InitiativeItemUpdated handler invoked', {
    eventType: event.type,
    hasPayload: !!event.payload,
    hasMetadata: !!event.metadata
  });
  if (event.type !== 'InitiativeItemUpdated') return;

  const { text } = event.payload || {};
  const meta = event.metadata as { initiativeId: string; itemId: string };
  const initiativeId = meta?.initiativeId;
  const itemId = meta?.itemId;

  console.log('[KANBAN PROJECTION] 📥 HANDLER: Processing InitiativeItemUpdated:', {
    initiativeId,
    itemId,
    newText: text
  });

  if (!initiativeId || !itemId) {
    console.warn('[KANBAN PROJECTION] ❌ HANDLER: Missing initiativeId or itemId:', { initiativeId, itemId });
    return;
  }

  let updated = false;
  Object.values(kanbanBoard).forEach(items => {
    const idx = items.findIndex(i => i.itemId === itemId && i.initiativeId === initiativeId);
    if (idx !== -1) {
      const oldText = items[idx].text;
      items[idx].text = text;
      updated = true;
      console.log('[KANBAN PROJECTION] ✅ HANDLER: Updated item text:', {
        itemId,
        oldText,
        newText: text,
        initiativeId
      });
    }
  });

  if (!updated) {
    console.warn('[KANBAN PROJECTION] ❌ HANDLER: Item not found for text update:', { itemId, initiativeId });
  }
});

registerProjectionHandler('InitiativeItemDeleted', (event: any) => {
  console.log('[KANBAN PROJECTION] 📥 HANDLER: InitiativeItemDeleted handler invoked', {
    eventType: event.type,
    hasPayload: !!event.payload,
    hasMetadata: !!event.metadata
  });
  if (event.type !== 'InitiativeItemDeleted') return;

  const meta = event.metadata as { initiativeId: string; itemId: string };
  const initiativeId = meta?.initiativeId;
  const itemId = meta?.itemId;

  console.log('[KANBAN PROJECTION] 📥 HANDLER: Processing InitiativeItemDeleted:', {
    initiativeId,
    itemId
  });

  if (!initiativeId || !itemId) {
    console.warn('[KANBAN PROJECTION] ❌ HANDLER: Missing initiativeId or itemId:', { initiativeId, itemId });
    return;
  }

  let removed = false;
  Object.keys(kanbanBoard).forEach(teamId => {
    const beforeCount = kanbanBoard[teamId].length;
    kanbanBoard[teamId] = kanbanBoard[teamId].filter(i => !(i.itemId === itemId && i.initiativeId === initiativeId));
    const afterCount = kanbanBoard[teamId].length;
    if (beforeCount !== afterCount) {
      removed = true;
      console.log('[KANBAN PROJECTION] ✅ HANDLER: Removed item from team:', {
        teamId,
        itemId,
        initiativeId,
        removedCount: beforeCount - afterCount,
        remainingCount: afterCount
      });
    }
  });

  if (!removed) {
    console.warn('[KANBAN PROJECTION] ❌ HANDLER: Item not found for deletion:', { itemId, initiativeId });
  }
});

registerProjectionHandler('ItemKanbanStatusMapped', (event: any) => {
  console.log('[KANBAN PROJECTION] 📥 HANDLER: ItemKanbanStatusMapped handler invoked', {
    eventType: event.type,
    hasPayload: !!event.payload,
    hasMetadata: !!event.metadata
  });
  if (event.type !== 'ItemKanbanStatusMapped') return;

  const { metadata, payload } = event;
  const meta = metadata as { teamId: string; initiativeId: string; itemId: string };
  const teamId = meta?.teamId;
  const initiativeId = meta?.initiativeId;
  const itemId = meta?.itemId;
  const status = payload?.status;

  console.log('[KANBAN PROJECTION] 📥 HANDLER: Processing ItemKanbanStatusMapped:', {
    teamId,
    initiativeId,
    itemId,
    status,
    payloadKeys: payload ? Object.keys(payload) : []
  });

  if (!teamId || !itemId) {
    console.warn('[KANBAN PROJECTION] ❌ HANDLER: Missing teamId or itemId:', { teamId, itemId });
    return;
  }

  if (!kanbanBoard[teamId]) {
    kanbanBoard[teamId] = [];
    console.log('[KANBAN PROJECTION] 🆕 HANDLER: Created new team array for status mapping:', teamId);
  }

  const idx = kanbanBoard[teamId].findIndex(i => i.itemId === itemId && i.initiativeId === initiativeId);
  if (idx !== -1) {
    const oldStatus = kanbanBoard[teamId][idx].status;
    kanbanBoard[teamId][idx].status = status;
    console.log('[KANBAN PROJECTION] ✅ HANDLER: Updated item status:', {
      itemId,
      oldStatus,
      newStatus: status,
      teamId,
      initiativeId
    });
  } else {
    console.warn('[KANBAN PROJECTION] ❌ HANDLER: Item not found for status update:', {
      itemId,
      initiativeId,
      teamId,
      availableItems: kanbanBoard[teamId].map(i => ({ itemId: i.itemId, initiativeId: i.initiativeId }))
    });
  }
});

// Query: Return all Kanban items grouped by team as an array for UI compatibility
export async function queryKanbanBoard() {
  // Ensure projection is built before returning data
  if (!_projectionBuilt) {
    console.log('[KANBAN PROJECTION] Projection not built yet, rebuilding...');
    await rebuildKanbanProjection();
    _projectionBuilt = true;
  }

  console.log('[KANBAN PROJECTION] queryKanbanBoard called');
  const result = Object.keys(kanbanBoard).map(teamId => ({
    teamId,
    items: [...kanbanBoard[teamId]],
  }));
  console.log('[KANBAN PROJECTION] Returning kanban board:', result.map(r => ({ teamId: r.teamId, itemCount: r.items.length })));
  return result;
}

export async function getKanbanBoardForTeam(teamId: string): Promise<KanbanBoardItem[]> {
  // Ensure projection is built before returning data
  if (!_projectionBuilt) {
    console.log('[KANBAN PROJECTION] Projection not built yet, rebuilding...');
    await rebuildKanbanProjection();
    _projectionBuilt = true;
  }

  const items = kanbanBoard[teamId] || [];
  console.log('[KANBAN PROJECTION] getKanbanBoardForTeam called for teamId:', teamId, 'items:', items.length);
  return items;
}

export async function emptyKanbanProjection() {
  console.log('[KANBAN PROJECTION] 🔄 EMPTY: Starting emptyKanbanProjection');
  console.log('[KANBAN PROJECTION] 🔄 EMPTY: Current board state before empty:', Object.keys(kanbanBoard).map(teamId => ({ teamId, count: kanbanBoard[teamId].length })));
  Object.keys(kanbanBoard).forEach(teamId => {
    kanbanBoard[teamId] = [];
  });
  console.log('[KANBAN PROJECTION] ✅ EMPTY: Board emptied successfully');
  console.log('[KANBAN PROJECTION] ✅ EMPTY: Final board state:', Object.keys(kanbanBoard).map(teamId => ({ teamId, count: kanbanBoard[teamId].length })));
}

export async function rebuildKanbanProjection() {
  console.log('[KANBAN PROJECTION] 🔄 REBUILD: Starting rebuildKanbanProjection');
  console.log('[KANBAN PROJECTION] 🔄 REBUILD: Current board state before rebuild:', Object.keys(kanbanBoard).map(teamId => ({ teamId, count: kanbanBoard[teamId].length })));

  await emptyKanbanProjection();

  console.log('[KANBAN PROJECTION] 🔄 REBUILD: Board emptied, now loading events');

  const allEvents = await _getAllEvents();
  console.log(`[KANBAN PROJECTION] 🔄 REBUILD: Loaded ${allEvents.length} events from event store`);

  if (!Array.isArray(allEvents)) {
    console.warn('[KANBAN PROJECTION] ❌ REBUILD: No events array returned from _getAllEvents');
    return;
  }

  console.log('[KANBAN PROJECTION] 🔄 REBUILD: All events to process:', allEvents.map(e => ({ type: e.type, entity: e.entity, aggregateId: e.aggregateId })));

  console.log('[KANBAN PROJECTION] 🔄 REBUILD: Dispatching events to handlers');
  let dispatchedCount = 0;
  let processedCount = 0;

  for (const event of allEvents) {
    console.log(`[KANBAN PROJECTION] 🔄 REBUILD: Processing event ${processedCount + 1}/${allEvents.length}:`, {
      type: event.type,
      entity: event.entity,
      aggregateId: event.aggregateId,
      hasMetadata: 'metadata' in event,
      payloadKeys: event.payload ? Object.keys(event.payload) : 'no payload'
    });

    const boardStateBefore = Object.keys(kanbanBoard).reduce((acc, teamId) => {
      acc[teamId] = kanbanBoard[teamId].length;
      return acc;
    }, {} as Record<string, number>);

    if (typeof (global as any).dispatchProjectionHandlers === 'function') {
      console.log('[KANBAN PROJECTION] 🔄 REBUILD: Dispatching event to handlers:', event.type);
      (global as any).dispatchProjectionHandlers(event);
      dispatchedCount++;
      console.log('[KANBAN PROJECTION] ✅ REBUILD: Event dispatched successfully');
    } else {
      console.warn('[KANBAN PROJECTION] ❌ REBUILD: dispatchProjectionHandlers not found on global');
    }

    const boardStateAfter = Object.keys(kanbanBoard).reduce((acc, teamId) => {
      acc[teamId] = kanbanBoard[teamId].length;
      return acc;
    }, {} as Record<string, number>);

    const stateChanged = JSON.stringify(boardStateBefore) !== JSON.stringify(boardStateAfter);
    console.log(`[KANBAN PROJECTION] 🔄 REBUILD: Board state ${stateChanged ? 'CHANGED' : 'UNCHANGED'} after event:`, {
      before: boardStateBefore,
      after: boardStateAfter
    });

    processedCount++;
  }

  console.log(`[KANBAN PROJECTION] ✅ REBUILD: Dispatched ${dispatchedCount} events to handlers out of ${allEvents.length} total events`);

  console.log('[KANBAN PROJECTION] ✅ REBUILD: Rebuild complete. Final board state:', Object.keys(kanbanBoard).map(teamId => ({ teamId, count: kanbanBoard[teamId].length })));
  console.log('[KANBAN PROJECTION] ✅ REBUILD: Final board details:', kanbanBoard);
}
