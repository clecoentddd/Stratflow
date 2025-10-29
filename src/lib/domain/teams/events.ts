import type { RadarEvent } from '../radar/events';
import type { StrategyEvent } from '../strategy/events';
import type { InitiativeEvent } from '../initiatives/events';

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
        name: string;
        purpose: string;
        context: string;
    }
>;


// Union of all events related to an Team
export type TeamEvent = TeamCreatedEvent | TeamUpdatedEvent | RadarEvent | StrategyEvent | InitiativeEvent;
