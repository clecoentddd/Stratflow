
import { NextResponse, NextRequest } from 'next/server';
import { saveEvents } from '@/lib/db/event-store';
import { getTeamByIdProjection } from '@/lib/db/projections';
import type { UpdateInitiativeCommand, DeleteInitiativeCommand } from '@/lib/domain/strategy/commands';
import type { InitiativeProgressUpdatedEvent, InitiativeRadarItemsLinkedEvent, InitiativeUpdatedEvent, InitiativeDeletedEvent } from '@/lib/domain/strategy/events';
import type { TeamEvent } from '@/lib/domain/teams/events';

// --- Vertical Slice: Update Initiative ---
export async function PUT(request: NextRequest, { params }: { params: { teamId: string, initiativeId: string } }) {
  try {
    const { teamId, initiativeId } = params;
    const command: UpdateInitiativeCommand = await request.json();

    // 1. Validation
    const team = await getTeamByIdProjection(teamId);
    if (!team) {
      return NextResponse.json({ message: 'Team not found' }, { status: 404 });
    }
    
    const initiative = team.dashboard.strategies
        .flatMap(s => s.initiatives)
        .find(i => i.id === initiativeId);

    if (!initiative) {
      return NextResponse.json({ message: 'Initiative not found' }, { status: 404 });
    }

    const eventsToSave: TeamEvent[] = [];

    // 2. Check for name update
    if (command.name && command.name !== initiative.name) {
      const nameUpdateEvent: InitiativeUpdatedEvent = {
        type: 'InitiativeUpdated',
        entity: 'team',
        aggregateId: teamId,
        timestamp: new Date().toISOString(),
        payload: {
          initiativeId: initiativeId,
          name: command.name,
        },
      };
      eventsToSave.push(nameUpdateEvent);
    }

    // 3. Check for progression update
    if (command.progression !== undefined && command.progression !== initiative.progression) {
      const progressEvent: InitiativeProgressUpdatedEvent = {
        type: 'InitiativeProgressUpdated',
        entity: 'team',
        aggregateId: teamId,
        timestamp: new Date().toISOString(),
        payload: {
          initiativeId: initiativeId,
          progression: command.progression,
        },
      };
      eventsToSave.push(progressEvent);
    }
    
    // 4. Check for linked radar items update
    if (command.linkedRadarItemIds) {
       const linkEvent: InitiativeRadarItemsLinkedEvent = {
        type: 'InitiativeRadarItemsLinked',
        entity: 'team',
        aggregateId: teamId,
        timestamp: new Date().toISOString(),
        payload: {
            initiativeId: initiativeId,
            linkedRadarItemIds: command.linkedRadarItemIds,
        }
       };
       eventsToSave.push(linkEvent);
    }


    // 5. Save Event(s)
    if (eventsToSave.length > 0) {
      await saveEvents(eventsToSave);
    } else {
      return NextResponse.json({ message: 'No changes detected' }, { status: 200 });
    }

    // 6. Respond
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Failed to update initiative:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// --- Vertical Slice: Delete Initiative ---
export async function DELETE(request: NextRequest, { params }: { params: { teamId: string, initiativeId: string } }) {
    try {
        const { teamId, initiativeId } = params;
        const command: Omit<DeleteInitiativeCommand, 'initiativeId'> = await request.json();

        // 1. Validation
        const team = await getTeamByIdProjection(teamId);
        if (!team) {
            return NextResponse.json({ message: 'Team not found' }, { status: 404 });
        }
        if (!command.strategyId) {
             return NextResponse.json({ message: 'Strategy ID is required for deletion' }, { status: 400 });
        }
        const strategy = team.dashboard.strategies.find(s => s.id === command.strategyId);
        if (!strategy || !strategy.initiatives.some(i => i.id === initiativeId)) {
            return NextResponse.json({ message: 'Initiative not found within the specified strategy' }, { status: 404 });
        }

        // 2. Create Event
        const event: InitiativeDeletedEvent = {
            type: 'InitiativeDeleted',
            entity: 'team',
            aggregateId: teamId,
            timestamp: new Date().toISOString(),
            payload: {
                initiativeId,
                strategyId: command.strategyId,
            }
        };

        // 3. Save Event
        await saveEvents([event]);

        // 4. Respond
        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error('Failed to delete initiative:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
