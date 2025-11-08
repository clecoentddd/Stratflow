import { registerProjectionHandler } from '@/lib/db/event-store';
import type { KanbanProjection, KanbanProjectionEntry } from './types';
import type { ElementMovedEvent, ElementAddedToKanbanEvent } from './events';

// In-memory kanban projection - stores status for each element
const kanbanProjection: KanbanProjection = {};

// Event handler for element moved events
registerProjectionHandler('ElementMoved', (event: any) => {
  console.log('[KANBAN PROJECTION] Processing ElementMoved event:', event);

  if (event.type !== 'ElementMoved') return;

  const { elementId, toStatus } = event.payload;
  if (kanbanProjection[elementId]) {
    kanbanProjection[elementId].status = toStatus;
    kanbanProjection[elementId].updatedAt = event.timestamp;
    console.log('[KANBAN PROJECTION] Updated element status:', { elementId, toStatus });
  } else {
    console.warn('[KANBAN PROJECTION] Element not found in projection:', elementId);
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

  // Note: In a real implementation, you would replay all ElementMoved and ElementAddedToKanban events
  // For now, this is a placeholder for when elements are added via domain listeners

  console.log('[KANBAN PROJECTION] Kanban projection rebuilt');
}