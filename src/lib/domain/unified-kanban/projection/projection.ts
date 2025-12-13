import type { KanbanProjection, KanbanProjectionEntry } from '../types';
import {
  getKanbanInitiativesProjection,
  getInitiativeStatus,
  getInitiativesByBoard,
  getInitiativesByTeam,
  rebuildKanbanInitiativesProjection,
  queryInitiativesKanbanBoard,
} from './kanban-initiatives-projection';
import {
  getKanbanInitiativeItemProjection,
  getInitiativeItemStatus,
  getInitiativeItemsByBoard,
  getInitiativeItemsByTeam,
  rebuildKanbanInitiativeItemProjection,
  queryInitiativeItemsKanbanBoard,
} from './kanban-initiative-item-projection';

export {
  getKanbanInitiativesProjection,
  getInitiativeStatus,
  getInitiativesByBoard,
  getInitiativesByTeam,
  rebuildKanbanInitiativesProjection,
  queryInitiativesKanbanBoard,
  getKanbanInitiativeItemProjection,
  getInitiativeItemStatus,
  getInitiativeItemsByBoard,
  getInitiativeItemsByTeam,
  rebuildKanbanInitiativeItemProjection,
  queryInitiativeItemsKanbanBoard,
};

export function getKanbanProjection(): KanbanProjection {
  return {
    ...getKanbanInitiativesProjection(),
    ...getKanbanInitiativeItemProjection(),
  };
}

export function getElementStatus(elementId: string): KanbanProjectionEntry | undefined {
  return getInitiativeStatus(elementId) ?? getInitiativeItemStatus(elementId);
}

export function getElementsByBoard(boardId?: string): KanbanProjection {
  if (!boardId) return getKanbanProjection();

  return {
    ...getInitiativesByBoard(boardId),
    ...getInitiativeItemsByBoard(boardId),
  };
}

export function getElementsByType(type: 'initiative' | 'initiative-item', boardId?: string): KanbanProjection {
  if (type === 'initiative') return getInitiativesByBoard(boardId);
  if (type === 'initiative-item') return getInitiativeItemsByBoard(boardId);
  return {};
}

export async function rebuildKanbanProjection(): Promise<void> {
  await Promise.all([
    rebuildKanbanInitiativesProjection(),
    rebuildKanbanInitiativeItemProjection(),
  ]);
}