import type { StrategyState } from '@/lib/types';
import type { CreateStrategyCommand, UpdateStrategyCommand } from './commands';
import type { StrategyEvent, StrategyCreatedEvent, StrategyUpdatedEvent } from './events';

type CommandHandlerResult<T> = { success: boolean; error?: string; event?: T };

export class StrategyCommandHandlers {
  private static getCurrentStates(events: StrategyEvent[]): Map<string, StrategyState> {
    const states = new Map<string, StrategyState>();
    
    events.forEach(event => {
      if (event.type === 'StrategyCreated') {
        // New strategies start as Draft
        states.set(event.payload.strategyId, 'Draft');
      } else if (event.type === 'StrategyUpdated' && event.payload.state) {
        // Update the state if a state change occurred
        states.set(event.payload.strategyId, event.payload.state);
      }
    });

    return states;
  }

  private static isStateAvailable(
    targetState: StrategyState,
    currentStates: Map<string, StrategyState>,
    excludeStrategyId?: string
  ): boolean {
    // Only check Draft and Active states
    if (!['Draft', 'Active'].includes(targetState)) {
      return true;
    }

    // Check if any other strategy (excluding the one being updated) is in the target state
    for (const [strategyId, state] of currentStates.entries()) {
      if (state === targetState && strategyId !== excludeStrategyId) {
        return false;
      }
    }
    return true;
  }

  static handleCreateStrategy(
    teamId: string,
    command: CreateStrategyCommand,
    events: StrategyEvent[]
  ): CommandHandlerResult<StrategyCreatedEvent> {
    const currentStates = this.getCurrentStates(events);
    
    // New strategies always start as Draft, so check if Draft state is available
    if (!this.isStateAvailable('Draft', currentStates)) {
      return {
        success: false,
        error: 'Cannot create new strategy: only one strategy can be in draft state at a time'
      };
    }

    return {
      success: true,
      event: {
        type: 'StrategyCreated',
        entity: 'team',
        aggregateId: teamId,
        timestamp: new Date().toISOString(),
        payload: {
          strategyId: `strat-${crypto.randomUUID()}`,
          description: command.description,
          timeframe: command.timeframe
        }
      }
    };
  }

  static handleUpdateStrategy(
    teamId: string,
    command: UpdateStrategyCommand,
    events: StrategyEvent[]
  ): CommandHandlerResult<StrategyUpdatedEvent> {
    // If not changing state or changing to a non-restricted state, allow it
    if (!command.state || !['Draft', 'Active'].includes(command.state)) {
      return {
        success: true,
        event: {
          type: 'StrategyUpdated',
          entity: 'team',
          aggregateId: teamId,
          timestamp: new Date().toISOString(),
          payload: command
        }
      };
    }

    const currentStates = this.getCurrentStates(events);
    
    // Check if the target state is available (excluding the current strategy)
    if (!this.isStateAvailable(command.state, currentStates, command.strategyId)) {
      return {
        success: false,
        error: `Cannot set strategy to ${command.state.toLowerCase()}: only one strategy can be in ${command.state.toLowerCase()} state at a time`
      };
    }

    return {
      success: true,
      event: {
        type: 'StrategyUpdated',
        entity: 'team',
        aggregateId: teamId,
        timestamp: new Date().toISOString(),
        payload: command
      }
    };
  }
}