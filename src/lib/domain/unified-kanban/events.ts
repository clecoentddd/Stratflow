import type { Event } from '../teams/events';

// Element moved in kanban (updates projection only)
export type ElementMovedEvent = Event<'ElementMoved', {
  elementId: string;
  fromStatus: string;
  toStatus: string;
  boardId?: string;
}, {
  teamId?: string;
}>;

// Element added to kanban (when initiative/item is created)
export type ElementAddedToKanbanEvent = Event<'ElementAddedToKanban', {
  elementId: string;
  elementType: 'initiative' | 'initiative-item';
  initialStatus: string; // typically "NEW"
  boardId?: string;
}, {
  teamId?: string;
}>;

export type UnifiedKanbanEvent = ElementMovedEvent | ElementAddedToKanbanEvent;