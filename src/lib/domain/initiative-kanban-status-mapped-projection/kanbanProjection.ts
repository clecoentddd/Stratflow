import type { KanbanBoardItem, KanbanStatus } from './types';
import { registerProjectionHandler } from '@/lib/db/event-store';
import { _getAllEvents } from '@/lib/db/event-store';
import type { InitiativeItemAddedEvent, InitiativeItemUpdatedEvent, InitiativeItemDeletedEvent } from '@/lib/domain/initiative-items/events';
import type { ItemKanbanStatusMappedEvent } from '@/lib/domain/initiative-kanban-status-mapped-event/events';

// In-memory projection (replace with persistent store as needed)
const kanbanBoard: Record<string, KanbanBoardItem[]> = {};

const KANBAN_STEP_KEYS = ['actions', 'proximateObjectives'];

console.log('[KANBAN PROJECTION] Module loaded, registering handlers');

// Register event handlers
registerProjectionHandler('InitiativeItemAdded', (event: any) => {
  console.log('[KANBAN PROJECTION] InitiativeItemAdded handler invoked', { eventType: event.type });
  if (event.type !== 'InitiativeItemAdded') return;

  const { stepKey, item } = event.payload || {};
  const meta = event.metadata as { initiativeId: string; itemId: string; teamId?: string };
  const initiativeId = meta?.initiativeId;
  const itemId = meta?.itemId;
  const teamId = meta?.teamId || 'unknown';

  console.log('[KANBAN PROJECTION] Processing InitiativeItemAdded:', { stepKey, initiativeId, itemId, teamId });

  if (!initiativeId || !itemId) {
    console.warn('[KANBAN PROJECTION] Missing initiativeId or itemId:', { initiativeId, itemId });
    return;
  }

  if (!teamId || teamId === 'unknown') {
    console.warn('[KANBAN PROJECTION] Missing or unknown teamId:', { teamId });
    return;
  }

  if (!KANBAN_STEP_KEYS.includes(stepKey)) {
    console.log('[KANBAN PROJECTION] Skipping non-kanban step:', { stepKey });
    return;
  }

  if (!kanbanBoard[teamId]) kanbanBoard[teamId] = [];

  kanbanBoard[teamId].push({
    itemId,
    initiativeId,
    teamId,
    name: '',
    text: item?.text || '',
    status: 'ToDo',
  });

  console.log('[KANBAN PROJECTION] Added item to kanbanBoard:', { teamId, itemId, initiativeId, text: item?.text });
  console.log('[KANBAN PROJECTION] Current board state:', Object.keys(kanbanBoard).map(teamId => ({ teamId, count: kanbanBoard[teamId].length })));
});

registerProjectionHandler('InitiativeItemUpdated', (event: any) => {
  console.log('[KANBAN PROJECTION] InitiativeItemUpdated handler invoked');
  if (event.type !== 'InitiativeItemUpdated') return;

  const { text } = event.payload || {};
  const meta = event.metadata as { initiativeId: string; itemId: string };
  const initiativeId = meta?.initiativeId;
  const itemId = meta?.itemId;

  if (!initiativeId || !itemId) return;

  Object.values(kanbanBoard).forEach(items => {
    const idx = items.findIndex(i => i.itemId === itemId && i.initiativeId === initiativeId);
    if (idx !== -1) {
      items[idx].text = text;
      console.log('[KANBAN PROJECTION] Updated item text:', { itemId, text });
    }
  });
});

registerProjectionHandler('InitiativeItemDeleted', (event: any) => {
  console.log('[KANBAN PROJECTION] InitiativeItemDeleted handler invoked');
  if (event.type !== 'InitiativeItemDeleted') return;

  const meta = event.metadata as { initiativeId: string; itemId: string };
  const initiativeId = meta?.initiativeId;
  const itemId = meta?.itemId;

  if (!initiativeId || !itemId) return;

  Object.keys(kanbanBoard).forEach(teamId => {
    const beforeCount = kanbanBoard[teamId].length;
    kanbanBoard[teamId] = kanbanBoard[teamId].filter(i => !(i.itemId === itemId && i.initiativeId === initiativeId));
    const afterCount = kanbanBoard[teamId].length;
    if (beforeCount !== afterCount) {
      console.log('[KANBAN PROJECTION] Removed item from team:', { teamId, itemId, removed: beforeCount - afterCount });
    }
  });
});

registerProjectionHandler('ItemKanbanStatusMapped', (event: any) => {
  console.log('[KANBAN PROJECTION] ItemKanbanStatusMapped handler invoked');
  if (event.type !== 'ItemKanbanStatusMapped') return;

  const { metadata, payload } = event;
  const meta = metadata as { teamId: string; initiativeId: string; itemId: string };
  const teamId = meta?.teamId;
  const initiativeId = meta?.initiativeId;
  const itemId = meta?.itemId;
  const status = payload?.status;

  if (!teamId || !itemId) return;

  if (!kanbanBoard[teamId]) kanbanBoard[teamId] = [];

  const idx = kanbanBoard[teamId].findIndex(i => i.itemId === itemId && i.initiativeId === initiativeId);
  if (idx !== -1) {
    kanbanBoard[teamId][idx].status = status;
    console.log('[KANBAN PROJECTION] Updated item status:', { itemId, status });
  }
});

// Query: Return all Kanban items grouped by team as an array for UI compatibility
export function queryKanbanBoard() {
  console.log('[KANBAN PROJECTION] queryKanbanBoard called');
  const result = Object.keys(kanbanBoard).map(teamId => ({
    teamId,
    items: [...kanbanBoard[teamId]],
  }));
  console.log('[KANBAN PROJECTION] Returning kanban board:', result.map(r => ({ teamId: r.teamId, itemCount: r.items.length })));
  return result;
}

export function getKanbanBoardForTeam(teamId: string): KanbanBoardItem[] {
  const items = kanbanBoard[teamId] || [];
  console.log('[KANBAN PROJECTION] getKanbanBoardForTeam called for teamId:', teamId, 'items:', items.length);
  return items;
}

export async function emptyKanbanProjection() {
  console.log('[KANBAN PROJECTION] Emptying kanbanBoard');
  Object.keys(kanbanBoard).forEach(teamId => {
    kanbanBoard[teamId] = [];
  });
  console.log('[KANBAN PROJECTION] Board emptied, current state:', Object.keys(kanbanBoard).map(teamId => ({ teamId, count: kanbanBoard[teamId].length })));
}

export async function rebuildKanbanProjection() {
  console.log('[KANBAN PROJECTION] Starting kanbanBoard rebuild');

  await emptyKanbanProjection();

  const allEvents = await _getAllEvents();
  console.log(`[KANBAN PROJECTION] Loaded ${allEvents.length} events from event store`);

  if (!Array.isArray(allEvents)) {
    console.warn('[KANBAN PROJECTION] No events array returned from _getAllEvents');
    return;
  }

  // Ensure projection handlers are loaded before dispatching events
  console.log('[KANBAN PROJECTION] Ensuring projection handlers are loaded');
  const { ensureProjectionHandlersLoaded } = await import('@/lib/db/event-store');
  await ensureProjectionHandlersLoaded();

  console.log('[KANBAN PROJECTION] Dispatching events to handlers');
  for (const event of allEvents) {
    console.log('[KANBAN PROJECTION] Processing event:', {
      type: event.type,
      entity: event.entity,
      aggregateId: event.aggregateId,
      hasMetadata: 'metadata' in event
    });

    if (typeof (global as any).dispatchProjectionHandlers === 'function') {
      console.log('[KANBAN PROJECTION] Dispatching event to handlers:', event.type);
      (global as any).dispatchProjectionHandlers(event);
    } else {
      console.warn('[KANBAN PROJECTION] dispatchProjectionHandlers not found on global');
    }
  }

  console.log('[KANBAN PROJECTION] Rebuild complete. Final board state:', Object.keys(kanbanBoard).map(teamId => ({ teamId, count: kanbanBoard[teamId].length })));
}
