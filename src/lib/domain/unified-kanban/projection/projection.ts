import { registerProjectionHandler } from '@/lib/db/event-store';
import type { KanbanProjection, KanbanProjectionEntry } from '../types';

// In-memory kanban projection - stores status for each element
const kanbanProjection: KanbanProjection = {};

// Mock DB table for move events (in-memory array)
const kanbanMoveTable: any[] = [];

// Event handler for element moved events
registerProjectionHandler('ElementMoved', (event: any) => {
  console.log('[KANBAN PROJECTION] Processing ElementMoved event:', event);

  if (event.type !== 'ElementMoved') {
    console.warn('[KANBAN PROJECTION] Ignored event (wrong type):', event.type);
    return;
  }

  const { elementId, toStatus, elementType } = event.payload;
  console.log('[KANBAN PROJECTION] Current projection before move:', JSON.stringify(kanbanProjection, null, 2));
  if (kanbanProjection[elementId]) {
    const prevStatus = kanbanProjection[elementId].status;
    kanbanProjection[elementId].status = toStatus;
    kanbanProjection[elementId].updatedAt = event.timestamp;
    console.log('[KANBAN PROJECTION] Updated element status:', { elementId, prevStatus, toStatus, elementType });
    console.log('[KANBAN PROJECTION] Projection after move:', JSON.stringify(kanbanProjection[elementId], null, 2));

    // Mock DB INSERT: append a row to the kanbanMoveTable
    kanbanMoveTable.push({
      elementId,
      fromStatus: prevStatus,
      toStatus,
      elementType,
      movedAt: event.timestamp,
    });
    console.log('[KANBAN PROJECTION] Mock DB INSERT (kanbanMoveTable):', kanbanMoveTable[kanbanMoveTable.length - 1]);
  } else {
    console.warn('[KANBAN PROJECTION] Element not found in projection:', elementId, 'Event:', event);
  }
});

// Event handler for element added to kanban
registerProjectionHandler('ElementAddedToKanban', (event: any) => {
  console.log('[KANBAN PROJECTION] Processing ElementAddedToKanban event:', event);

  if (event.type !== 'ElementAddedToKanban') return;

  const { elementId, elementType, initialStatus, boardId } = event.payload;
  kanbanProjection[elementId] = {
    type: elementType,
    status: initialStatus,
    boardId,
    addedAt: event.timestamp,
    updatedAt: event.timestamp,
  };
  console.log('[KANBAN PROJECTION] Added element to kanban:', { elementId, elementType, initialStatus });
});

// Query functions
export function getKanbanProjection(): KanbanProjection {
  return { ...kanbanProjection };
}

export function getElementStatus(elementId: string): KanbanProjectionEntry | undefined {
  return kanbanProjection[elementId];
}

export function getElementsByBoard(boardId?: string): KanbanProjection {
  if (!boardId) return getKanbanProjection();

  const filtered: KanbanProjection = {};
  for (const [elementId, entry] of Object.entries(kanbanProjection)) {
    if (entry.boardId === boardId) {
      filtered[elementId] = entry;
    }
  }
  return filtered;
}

export function getElementsByType(type: 'initiative' | 'initiative-item', boardId?: string): KanbanProjection {
  const source = boardId ? getElementsByBoard(boardId) : getKanbanProjection();

  const filtered: KanbanProjection = {};
  for (const [elementId, entry] of Object.entries(source)) {
    if (entry.type === type) {
      filtered[elementId] = entry;
    }
  }
  return filtered;
}

// Rebuild projection from events (for initialization)
export async function rebuildKanbanProjection(): Promise<void> {
  console.log('[KANBAN PROJECTION] Rebuilding kanban projection');

  // Clear existing projection
  Object.keys(kanbanProjection).forEach(key => delete kanbanProjection[key]);

  // Load all events from the event store
  const { _getAllEvents } = await import('@/lib/db/event-store');
  const allEvents = await _getAllEvents();

  console.log('[KANBAN PROJECTION] Replaying events to rebuild projection:', allEvents.length);
  for (const event of allEvents) {
    console.log(`[KANBAN PROJECTION] [REPLAY] Event:`, JSON.stringify(event, null, 2));
    if (event.type === 'ElementAddedToKanban' && event.payload) {
      const { elementId, elementType, initialStatus, boardId } = event.payload;
      kanbanProjection[elementId] = {
        type: elementType,
        status: initialStatus,
        boardId,
        addedAt: event.timestamp,
        updatedAt: event.timestamp,
      };
      console.log(`[KANBAN PROJECTION] [REPLAY] Added element: ${elementId} (${elementType}) to ${initialStatus}`);
    }
    if (event.type === 'ElementMoved' && event.payload) {
      const { elementId, toStatus } = event.payload;
      if (elementId && toStatus && kanbanProjection[elementId]) {
        const prevStatus = kanbanProjection[elementId].status;
        kanbanProjection[elementId].status = toStatus;
        kanbanProjection[elementId].updatedAt = event.timestamp;
        console.log(`[KANBAN PROJECTION] [REPLAY] Moved element: ${elementId} from ${prevStatus} to ${toStatus}`);
      } else {
        console.warn(`[KANBAN PROJECTION] [REPLAY] ElementMoved event for missing element: ${elementId}`);
      }
    }
  }

  console.log('[KANBAN PROJECTION] Final projection after replay:', JSON.stringify(kanbanProjection, null, 2));
  console.log('[KANBAN PROJECTION] Kanban projection rebuilt from event log');
}