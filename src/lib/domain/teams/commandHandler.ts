import { v4 as uuidv4 } from 'uuid';
import { saveEvents } from '@/lib/db/event-store';
import { getTeamByIdProjection } from '@/lib/domain/teams/projection';
import type { CreateTeamCommand, UpdateTeamCommand } from './commands';
import type { TeamCreatedEvent, TeamUpdatedEvent } from './events';

export class TeamsCommandHandlers {
  
  static async handleCreateTeam(command: CreateTeamCommand) {
    // 1. Validation
    if (!command || !command.name || !command.companyId || typeof command.level !== 'number' || Number.isNaN(command.level)) {
      throw new Error('Invalid team create command: name, companyId and numeric level are required');
    }

    // 2. Create Event
    const newTeamId = `team-${uuidv4()}`;
    const event: TeamCreatedEvent = {
      type: 'TeamCreated',
      entity: 'team',
      aggregateId: newTeamId,
      timestamp: new Date().toISOString(),
      payload: {
        id: newTeamId,
        companyId: command.companyId,
        name: command.name,
        purpose: command.purpose ?? '',
        context: command.context ?? '',
        level: command.level ?? 0,
      },
    };

    // 3. Save Event
    await saveEvents([event]);

    console.log('[Teams CommandHandler] created team', newTeamId, { companyId: command.companyId, name: command.name });

    // 4. Return the created team projection
    const created = await getTeamByIdProjection(newTeamId);
    return created;
  }

  static async handleUpdateTeam(command: UpdateTeamCommand) {
    // 1. Validation
    if (!command || !command.id) {
      throw new Error('Invalid update command: team ID is required');
    }

    // 2. Create Event
    const event: TeamUpdatedEvent = {
      type: 'TeamUpdated',
      entity: 'team',
      aggregateId: command.id,
      timestamp: new Date().toISOString(),
      payload: {
        name: command.name,
        purpose: command.purpose,
        context: command.context,
        level: typeof command.level === 'number' ? command.level : undefined,
      },
    };

    // 3. Save Event
    await saveEvents([event]);

    console.log('[Teams CommandHandler] updated team', command.id, { name: command.name });

    // 4. Return the updated team projection
    const updated = await getTeamByIdProjection(command.id);
    return updated;
  }
}