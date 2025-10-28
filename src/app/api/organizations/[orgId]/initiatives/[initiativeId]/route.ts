
import { NextResponse, NextRequest } from 'next/server';
import { saveEvents } from '@/lib/db/event-store';
import { getTeamByIdProjection } from '@/lib/db/projections';
import type { UpdateInitiativeCommand } from '@/lib/domain/strategy/commands';
import type { InitiativeProgressUpdatedEvent, InitiativeRadarItemsLinkedEvent } from '@/lib/domain/strategy/events';
import type { TeamEvent } from '@/lib/domain/teams/events';

// --- Vertical Slice: Update Initiative ---
export async function PUT(request: NextRequest, { params }: { params: { orgId: string, initiativeId: string } }) {
  try {
    const { orgId, initiativeId } = params;
    const command: UpdateInitiativeCommand = await request.json();

    // 1. Validation
    const team = await getTeamByIdProjection(orgId);
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

    // 2. Check for progression update
    if (command.progression !== undefined && command.progression !== initiative.progression) {
      const progressEvent: InitiativeProgressUpdatedEvent = {
        type: 'InitiativeProgressUpdated',
        entity: 'team',
        aggregateId: orgId,
        timestamp: new Date().toISOString(),
        payload: {
          initiativeId: initiativeId,
          progression: command.progression,
        },
      };
      eventsToSave.push(progressEvent);
    }
    
    // 3. Check for linked radar items update
    if (command.linkedRadarItemIds) {
       const linkEvent: InitiativeRadarItemsLinkedEvent = {
        type: 'InitiativeRadarItemsLinked',
        entity: 'team',
        aggregateId: orgId,
        timestamp: new Date().toISOString(),
        payload: {
            initiativeId: initiativeId,
            linkedRadarItemIds: command.linkedRadarItemIds,
        }
       };
       eventsToSave.push(linkEvent);
    }


    // 4. Save Event(s)
    if (eventsToSave.length > 0) {
      await saveEvents(eventsToSave);
    } else {
      return NextResponse.json({ message: 'No changes detected' }, { status: 200 });
    }

    // 5. Respond
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Failed to update initiative:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
