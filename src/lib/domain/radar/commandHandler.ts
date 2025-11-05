import { v4 as uuidv4 } from 'uuid';
import { getTeamByIdProjection, applyEventsToTeam } from '@/lib/db/projections';
import { saveEvents, _getAllEvents } from '@/lib/db/event-store';
import type { UpsertRadarItemCommand } from './commands';
import type { RadarItemCreatedEvent } from './RadarItemCreatedEvent';
import type { RadarItemUpdatedEvent } from './RadarItemUpdatedEvent';
import type { RadarItemDeletedEvent } from './RadarItemDeletedEvent';

// Helper function to get events for a specific team
const getEventsForTeam = async (teamId: string) => {
  const allEvents = await _getAllEvents();
  return allEvents.filter(event => event.aggregateId === teamId && event.entity === 'team') as any[];
};

export class RadarCommandHandlers {
  
  static async handleCreateRadarItem(teamId: string, command: UpsertRadarItemCommand) {
    // 1. Validation
    const team = await getTeamByIdProjection(teamId);
    if (!team) {
      throw new Error('Team not found');
    }
    if (!command.name) {
      throw new Error('Radar item name is required');
    }

    // 2. Create Event
    const event: RadarItemCreatedEvent = {
      type: 'RadarItemCreated',
      entity: 'team',
      aggregateId: teamId,
      timestamp: new Date().toISOString(),
      payload: {
        ...command,
        id: `radar-${uuidv4()}`,
        radarId: teamId,
        created_at: new Date().toISOString(),
      },
    };

    // 3. Save Event(s) to Event Store
    await saveEvents([event]);

    // 4. Re-project to get the latest state
    const allEventsForTeam = await getEventsForTeam(teamId);
    const updatedTeamState = applyEventsToTeam(null, allEventsForTeam);

    if (!updatedTeamState) {
      throw new Error('Failed to apply event to create radar item.');
    }
    
    return updatedTeamState;
  }

  static async handleUpdateRadarItem(teamId: string, command: UpsertRadarItemCommand) {
    // 1. Validation
    const team = await getTeamByIdProjection(teamId);
    if (!team) {
      throw new Error('Team not found');
    }
    const existingItem = team.radar.find(item => item.id === command.id);
    if (!existingItem) {
      throw new Error('Radar item not found');
    }

    // 2. Create Event
    const event: RadarItemUpdatedEvent = {
      type: 'RadarItemUpdated',
      entity: 'team',  
      aggregateId: teamId,
      timestamp: new Date().toISOString(),
      payload: {
        ...command,
        updated_at: new Date().toISOString(),
      }
    };

    // 3. Save Event(s) to Event Store
    await saveEvents([event]);
    
    // 4. Re-project to get the latest state
    const allEventsForTeam = await getEventsForTeam(teamId);
    const updatedTeamState = applyEventsToTeam(null, allEventsForTeam);

    if (!updatedTeamState) {
      throw new Error('Failed to apply event to update radar item.');
    }

    return updatedTeamState;
  }

  static async handleDeleteRadarItem(teamId: string, itemId: string) {
    // 1. Validation
    const team = await getTeamByIdProjection(teamId);
    if (!team) {
      throw new Error('Team not found');
    }
    if (!team.radar.find(item => item.id === itemId)) {
      throw new Error('Radar item not found');
    }

    // 2. Create Event
    const event: RadarItemDeletedEvent = {
      type: 'RadarItemDeleted',
      entity: 'team',
      aggregateId: teamId,
      timestamp: new Date().toISOString(),
      payload: {
        id: itemId,
      }
    };

    // 3. Save Event
    await saveEvents([event]);
    
    // 4. Re-project to get the latest state
    const allEventsForTeam = await getEventsForTeam(teamId);
    const updatedTeamState = applyEventsToTeam(null, allEventsForTeam);

    if (!updatedTeamState) {
      throw new Error('Failed to apply delete event to radar item.');
    }

    return updatedTeamState;
  }
}