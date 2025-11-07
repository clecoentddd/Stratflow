import type { Event } from '@/lib/domain/teams/events';
import type { InitiativeItem } from '@/lib/types';

export type InitiativeItemAddedEvent = Event<
  'InitiativeItemAdded',
  {
    stepKey: string;
    item: Omit<InitiativeItem, 'id'>;
  },
  {
    initiativeId: string;
    itemId: string;
    teamId: string;
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
