import type { Event } from '../teams/events';
import type { InitiativeStep } from '@/lib/types';

export type InitiativeCreatedEvent = Event<
  'InitiativeCreated',
  {
    strategyId: string;
    name: string;
  },
  {
    initiativeId: string;
  }
>;

export type InitiativeUpdatedEvent = Event<
  'InitiativeUpdated',
  {
    initiativeId: string;
    name: string;
  }
>;

export type InitiativeProgressUpdatedEvent = Event<
  'InitiativeProgressUpdated',
  {
    progression: number;
  },
  {
    initiativeId: string;
  }
>;

export type InitiativeDeletedEvent = Event<
    'InitiativeDeleted',
    {
        initiativeId: string;
        strategyId: string;
    }
>;

export type InitiativeRadarItemsLinkedEvent = Event<
    'InitiativeRadarItemsLinked',
    {
        initiativeId: string;
        linkedRadarItemIds: string[];
    }
>;

export type InitiativeEvent =
  | InitiativeCreatedEvent
  | InitiativeUpdatedEvent
  | InitiativeDeletedEvent
  | InitiativeProgressUpdatedEvent
  | InitiativeRadarItemsLinkedEvent;