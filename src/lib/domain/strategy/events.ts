
import type { Event } from '../organizations/events';
import type { StrategyState, InitiativeItem, InitiativeStep } from '@/lib/types';
import { newInitiativeTemplate } from '@/lib/data';

// --- Strategy Events ---
export type StrategyCreatedEvent = Event<
  'StrategyCreated',
  {
    strategyId: string;
    description: string;
    timeframe: string;
  }
>;

export type StrategyStateUpdatedEvent = Event<
  'StrategyStateUpdated',
  {
    strategyId: string;
    state: StrategyState;
  }
>;

// --- Initiative Events ---
export type InitiativeCreatedEvent = Event<
  'InitiativeCreated',
  {
    strategyId: string;
    initiativeId: string;
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

// --- Initiative Item Events ---
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


export type StrategyEvent =
  | StrategyCreatedEvent
  | StrategyStateUpdatedEvent
  | InitiativeCreatedEvent
  | InitiativeProgressUpdatedEvent
  | InitiativeRadarItemsLinkedEvent
  | InitiativeItemAddedEvent
  | InitiativeItemUpdatedEvent
  | InitiativeItemDeletedEvent;
