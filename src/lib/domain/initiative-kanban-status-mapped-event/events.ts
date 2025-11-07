import type { Event } from '@/lib/domain/teams/events';

export type KanbanStatus = 'ToDo' | 'Doing' | 'Done';

export type ItemKanbanStatusMappedEvent = Event<
  'ItemKanbanStatusMapped',
  {
    status: KanbanStatus;
  },
  {
    teamId: string;
    initiativeId: string;
    itemId: string;
  }
>;
