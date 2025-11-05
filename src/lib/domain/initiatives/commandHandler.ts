import { v4 as uuidv4 } from 'uuid';
import { saveEvents } from '@/lib/db/event-store';
import { getTeamByIdProjection } from '@/lib/db/projections';
import type { CreateInitiativeCommand, UpdateInitiativeCommand, DeleteInitiativeCommand } from './commands';
import type { InitiativeCreatedEvent, InitiativeUpdatedEvent, InitiativeDeletedEvent } from './events';
import { newInitiativeTemplate } from './constants';

export class InitiativesCommandHandlers {
  
  static async handleCreateInitiative(teamId: string, command: CreateInitiativeCommand) {
    // 1. Validation
    if (!teamId) {
      throw new Error('teamId is required');
    }
    if (!command.name) {
      throw new Error('Initiative name is required');
    }

    if (!command.strategyId) {
      throw new Error('Strategy ID is required');
    }

    const team = await getTeamByIdProjection(teamId);
    if (!team) {
      throw new Error('Team not found');
    }
    
    const strategy = team.dashboard.strategies.find(s => s.id === command.strategyId);
    if (!strategy) {
      throw new Error('Strategy not found');
    }

    // 2. Create Event - Clean minimal payload
    const initiativeId = `init-${uuidv4()}`;
    const event: InitiativeCreatedEvent = {
      type: 'InitiativeCreated',
      entity: 'team',
      aggregateId: teamId,
      timestamp: new Date().toISOString(),
      payload: {
        strategyId: command.strategyId,
        strategyName: strategy.description, // Include strategy name
        name: command.name,
      },
      metadata: {
        initiativeId: initiativeId,
      },
    };

    // 3. Save Event
    await saveEvents([event]);

    console.log('[Initiatives CommandHandler] created initiative', initiativeId, { teamId, strategyId: command.strategyId, name: command.name });

    // 4. Create the complete initiative data for response
    const newInitiative = {
      id: initiativeId,
      name: command.name,
      progression: 0,
      steps: [
        { key: 'diagnostic', title: 'Diagnostic', iconName: 'Search', items: [] },
        { key: 'overallApproach', title: 'Overall Approach', iconName: 'Milestone', items: [] },
        { key: 'actions', title: 'Actions', iconName: 'ListChecks', items: [] },
        { key: 'proximateObjectives', title: 'Proximate Objectives', iconName: 'Target', items: [] },
      ],
      linkedRadarItemIds: [],
      created_at: event.timestamp,
      updated_at: event.timestamp,
    };

    // 5. Return complete data
    return { 
      success: true, 
      initiative: newInitiative
    };
  }

  static async handleUpdateInitiative(teamId: string, command: UpdateInitiativeCommand) {
    // 1. Validation
    if (!teamId) {
      throw new Error('teamId is required');
    }
    if (!command.initiativeId) {
      throw new Error('initiativeId is required');
    }

    const team = await getTeamByIdProjection(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    // Find the initiative across all strategies
    let foundInitiative = null;
    let foundStrategy = null;
    for (const strategy of team.dashboard.strategies) {
      const initiative = strategy.initiatives.find(i => i.id === command.initiativeId);
      if (initiative) {
        foundInitiative = initiative;
        foundStrategy = strategy;
        break;
      }
    }

    if (!foundInitiative || !foundStrategy) {
      throw new Error('Initiative not found');
    }

    // 2. Create appropriate event based on what's being updated
    let event;
    
    if (typeof command.progression === 'number' && !command.name) {
      // Specific event for progression updates
      event = {
        type: 'InitiativeProgressUpdated' as const,
        entity: 'team' as const,
        aggregateId: teamId,
        timestamp: new Date().toISOString(),
        payload: {
          progression: command.progression,
        },
        metadata: {
          initiativeId: command.initiativeId,
        },
      };
    } else {
      // General update event for name and other fields
      event = {
        type: 'InitiativeUpdated' as const,
        entity: 'team' as const,
        aggregateId: teamId,
        timestamp: new Date().toISOString(),
        payload: {
          initiativeId: command.initiativeId,
          name: command.name || foundInitiative.name,
        },
      };
    }

    // 3. Save Event
    await saveEvents([event]);

    console.log('[Initiatives CommandHandler] updated initiative', command.initiativeId, { teamId });

    // 4. Return result
    return { 
      success: true, 
      message: 'Initiative updated successfully'
    };
  }

  static async handleDeleteInitiative(teamId: string, command: DeleteInitiativeCommand) {
    // 1. Validation
    if (!teamId) {
      throw new Error('teamId is required');
    }
    if (!command.initiativeId) {
      throw new Error('initiativeId is required');
    }
    if (!command.strategyId) {
      throw new Error('strategyId is required');
    }

    const team = await getTeamByIdProjection(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const strategy = team.dashboard.strategies.find(s => s.id === command.strategyId);
    if (!strategy) {
      throw new Error('Strategy not found');
    }

    const initiative = strategy.initiatives.find(i => i.id === command.initiativeId);
    if (!initiative) {
      throw new Error('Initiative not found');
    }

    // 2. Create Event
    const event: InitiativeDeletedEvent = {
      type: 'InitiativeDeleted',
      entity: 'team',
      aggregateId: teamId,
      timestamp: new Date().toISOString(),
      payload: {
        initiativeId: command.initiativeId,
        strategyId: command.strategyId,
      },
    };

    // 3. Save Event
    await saveEvents([event]);

    console.log('[Initiatives CommandHandler] deleted initiative', command.initiativeId, { teamId, strategyId: command.strategyId });

    // 4. Return result
    return { 
      success: true, 
      message: 'Initiative deleted successfully'
    };
  }
}