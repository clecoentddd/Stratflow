// Query: Return all Kanban items grouped by team as an array for UI compatibility
export function queryKanbanBoard() {
  // Return an array of { teamId, items } objects
  return Object.keys(kanbanBoard).map(teamId => ({
    teamId,
    items: [...kanbanBoard[teamId]],
  }));
}
import type { KanbanBoardItem, KanbanStatus } from './types';
import { registerProjectionHandler } from '@/lib/db/event-store';
import { _getAllEvents } from '@/lib/db/event-store';
import type { InitiativeItemAddedEvent, InitiativeItemUpdatedEvent, InitiativeItemDeletedEvent } from '@/lib/domain/initiative-items/events';
import type { ItemKanbanStatusMappedEvent } from '@/lib/domain/initiative-kanban-status-mapped-event/events';


// In-memory projection (replace with persistent store as needed)
const kanbanBoard: Record<string, KanbanBoardItem[]> = {};

const KANBAN_STEP_KEYS = ['actions', 'proximateObjectives'];

registerProjectionHandler('InitiativeItemAdded', (event: any) => {
  if (event.type !== 'InitiativeItemAdded') return;
  const { stepKey, item } = event.payload || {};
  const meta = event.metadata as { initiativeId: string; itemId: string; teamId?: string };
  const initiativeId = meta?.initiativeId;
  const itemId = meta?.itemId;
  const teamId = meta?.teamId || 'unknown';
  console.log('[KANBAN PROJECTION] InitiativeItemAdded handler:', { stepKey, item, meta });
  if (!initiativeId || !itemId) {
    console.warn('[KANBAN PROJECTION] InitiativeItemAdded missing initiativeId or itemId:', { initiativeId, itemId });
    return;
  }
  if (!KANBAN_STEP_KEYS.includes(stepKey)) {
    console.warn('[KANBAN PROJECTION] InitiativeItemAdded stepKey not in KANBAN_STEP_KEYS:', { stepKey });
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
  console.log('[KANBAN PROJECTION] Current kanbanBoard:', JSON.stringify(kanbanBoard));
});

registerProjectionHandler('InitiativeItemUpdated', (event: any) => {
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
    }
  });
});

registerProjectionHandler('InitiativeItemDeleted', (event: any) => {
  if (event.type !== 'InitiativeItemDeleted') return;
  const meta = event.metadata as { initiativeId: string; itemId: string };
  const initiativeId = meta?.initiativeId;
  const itemId = meta?.itemId;
  if (!initiativeId || !itemId) return;
  Object.keys(kanbanBoard).forEach(teamId => {
    kanbanBoard[teamId] = kanbanBoard[teamId].filter(i => !(i.itemId === itemId && i.initiativeId === initiativeId));
  });
});

registerProjectionHandler('ItemKanbanStatusMapped', (event: any) => {
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
  }
});


export function getKanbanBoardForTeam(teamId: string): KanbanBoardItem[] {
  const items = kanbanBoard[teamId] || [];
  console.log('[KANBAN PROJECTION] getKanbanBoardForTeam called for teamId:', teamId, 'items:', items);
  return items;
}

export async function emptyKanbanProjection() {
  console.log('[KANBAN PROJECTION] Emptying kanbanBoard');
  Object.keys(kanbanBoard).forEach(teamId => {
    kanbanBoard[teamId] = [];
  });
  console.log('[KANBAN PROJECTION] State after empty:', JSON.stringify(kanbanBoard));
}

export async function rebuildKanbanProjection() {
  console.log('[KANBAN PROJECTION] Rebuilding kanbanBoard');
  await emptyKanbanProjection();
  const allEvents = await _getAllEvents();
  console.log(`[KANBAN PROJECTION] Loaded ${Array.isArray(allEvents) ? allEvents.length : 0} events from event store`);
  if (Array.isArray(allEvents)) {
    for (const event of allEvents) {
      console.log('[KANBAN PROJECTION] Replaying event:', event.type, event);
      if (typeof (global as any).dispatchProjectionHandlers === 'function') {
        (global as any).dispatchProjectionHandlers(event);
      } else {
        console.warn('[KANBAN PROJECTION] dispatchProjectionHandlers not found on global');
      }
    }
  } else {
    console.warn('[KANBAN PROJECTION] No events array returned from _getAllEvents');
  }
  console.log('[KANBAN PROJECTION] State after rebuild:', JSON.stringify(kanbanBoard));
}
