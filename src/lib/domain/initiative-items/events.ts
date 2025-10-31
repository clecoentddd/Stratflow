import type { Event } from '@/lib/domain/teams/events';
import type { InitiativeItem } from '@/lib/types';

export type InitiativeItemAddedEvent = Event<
  'InitiativeItemAdded',
  {
    initiativeId: string;
    stepKey: string;
    item: InitiativeItem;
  }
>;

export type InitiativeItemUpdatedEvent = Event<
  'InitiativeItemUpdated',
  {
    initiativeId: string;
    itemId: string;
    text: string;
  }
>;

export type InitiativeItemDeletedEvent = Event<
  'InitiativeItemDeleted',
  {
    initiativeId: string;
    itemId: string;
  }
>;
