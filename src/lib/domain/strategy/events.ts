
import type { Event } from '../teams/events';
import type { StrategyState } from '@/lib/types';
import type { InitiativeEvent } from '../initiatives/events';

export type StrategyCreatedEvent = Event<
  'StrategyCreated',
  {
    strategyId: string;
    description: string;
    timeframe: string;
  }
>;

export type StrategyUpdatedEvent = Event<
  'StrategyUpdated',
  {
    strategyId: string;
    description?: string;
    timeframe?: string;
    state?: StrategyState;
  }
>;

export type StrategyEvent =
  | StrategyCreatedEvent
  | StrategyUpdatedEvent
  | InitiativeEvent;
