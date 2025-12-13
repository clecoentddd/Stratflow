import type { Event } from '../teams/events';

// Element moved in kanban (updates projection only)

export type ElementMovedEvent = Event<'ElementMoved', {
  elementId: string;
  elementType: 'initiative' | 'initiative-item';
  toStatus: string;
  // Optionally, add timestamp here if not in root
  tags: string[];
}, {
  // Add any additional metadata if needed
}>;

export type InitiativeAddedToKanbanEvent = Event<'InitiativeAddedToKanban', {
  initiativeId: string;
  initialStatus: string;
  boardId?: string;
}, {
  teamId?: string;
}>;

export type InitiativeItemAddedToKanbanEvent = Event<'InitiativeItemAddedToKanban', {
  itemId: string;
  initiativeId: string;
  initialStatus: string;
  boardId?: string;
}, {
  teamId?: string;
}>;

export type UnifiedKanbanEvent =
  | ElementMovedEvent
  | InitiativeAddedToKanbanEvent
  | InitiativeItemAddedToKanbanEvent;