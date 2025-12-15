import type { Event } from '@/lib/domain/teams/events';

export type InitiativeItemCreatedEvent = Event<
  'InitiativeItemCreated',
  {
    initiativeId: string;
    itemId: string;
    stepKey: string;
    text: string;
    status?: 'todo' | 'doing' | 'done';
  }
>;

export type InitiativeItemUpdatedEvent = Event<
  'InitiativeItemUpdated',
  {
    text: string;
  },
  {
    initiativeId: string;
    itemId: string;
    teamId: string;
  }
>;

export type InitiativeItemDeletedEvent = Event<
  'InitiativeItemDeleted',
  {},
  {
    initiativeId: string;
    itemId: string;
    teamId: string;
  }
>;
