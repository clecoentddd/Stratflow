import type { KanbanStatus } from '@/lib/domain/initiative-kanban-status-mapped-event/events';

export type MapItemKanbanStatusCommand = {
  type: 'MapItemKanbanStatus';
  payload: {
    teamId: string;
    initiativeId: string;
    itemId: string;
    status: KanbanStatus;
  };
};
