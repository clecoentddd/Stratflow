import type { Event } from '../teams/events';
import type { InitiativeItem, InitiativeStep } from '@/lib/types';

export type InitiativeCreatedEvent = Event<
  'InitiativeCreated',
  {
    strategyId: string;
    initiativeId: string;
    tempId: string; // Add temporary ID for optimistic UI
    name: string;
    template: {
      id: string;
      name: string;
      progression: number;
      steps: InitiativeStep[];
      linkedRadarItemIds: string[];
    }
  }
>;

export type InitiativeUpdatedEvent = Event<
  'InitiativeUpdated',
  {
    initiativeId: string;
    name: string;
  }
>;

export type InitiativeDeletedEvent = Event<
    'InitiativeDeleted',
    {
        initiativeId: string;
        strategyId: string;
    }
>;

export type InitiativeProgressUpdatedEvent = Event<
  'InitiativeProgressUpdated',
  {
    initiativeId: string;
    progression: number;
  }
>;

export type InitiativeRadarItemsLinkedEvent = Event<
    'InitiativeRadarItemsLinked',
    {
        initiativeId: string;
        linkedRadarItemIds: string[];
    }
>;

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

export type InitiativeEvent =
  | InitiativeCreatedEvent
  | InitiativeUpdatedEvent
  | InitiativeDeletedEvent
  | InitiativeProgressUpdatedEvent
  | InitiativeRadarItemsLinkedEvent
  | InitiativeItemAddedEvent
  | InitiativeItemUpdatedEvent
  | InitiativeItemDeletedEvent;