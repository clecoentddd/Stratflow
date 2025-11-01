import type { RadarEvent } from '../radar/events';
import type { StrategyEvent } from '../strategies/events';
import type { InitiativeEvent } from '../initiatives/events';
import type {
  InitiativeItemAddedEvent,
  InitiativeItemUpdatedEvent,
  InitiativeItemDeletedEvent,
} from '../initiative-items/events';

// Event Sourcing and CQRS Types
export type Event<T extends string, P> = {
  type: T;
  payload: P;
  timestamp: string;
  aggregateId: string; // The ID of the entity the event belongs to (e.g., Team ID)
  entity: string; // The type of entity (e.g., 'team')
};

export type TeamCreatedEvent = Event<
  'TeamCreated',
  {
    id: string;
    companyId: string;
    name: string;
    purpose: string;
    context: string;
    level: number;
  }
>;

export type TeamUpdatedEvent = Event<
    'TeamUpdated',
    {
    name?: string;
    purpose?: string;
    context?: string;
    level?: number;
    }
>;


// Union of all events related to an Team
export type TeamEvent =
  | TeamCreatedEvent
  | TeamUpdatedEvent
  | RadarEvent
  | StrategyEvent
  | InitiativeEvent
  | InitiativeItemAddedEvent
  | InitiativeItemUpdatedEvent
  | InitiativeItemDeletedEvent;
