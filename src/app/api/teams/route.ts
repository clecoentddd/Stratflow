
import { NextResponse, NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  getTeamsProjection,
  applyEventsToTeam,
  getTeamByIdProjection,
} from '@/lib/db/projections';
import { saveEvents, getEventsFor } from '@/lib/db/event-store';
import type { CreateTeamCommand, UpdateTeamCommand } from '@/lib/domain/teams/commands';
import type { TeamCreatedEvent, TeamUpdatedEvent, TeamEvent } from '@/lib/domain/teams/events';

// --- Vertical Slice: GET Teams ---
export async function GET(request: NextRequest) {
  try {
    const teams = await getTeamsProjection();
    return NextResponse.json(teams);
  } catch (error) {
    console.error('Failed to get teams projection:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// --- Vertical Slice: Create Team ---
export async function POST(request: NextRequest) {
  try {
    // 1. Parse and Validate the Command
    const command: CreateTeamCommand = await request.json();
    if (!command.name || !command.purpose || !command.companyId) {
      return NextResponse.json(
        { message: 'Company ID, name, and purpose are required' },
        { status: 400 }
      );
    }

    // 2. Command Handler Logic
    const newTeamId = `team-${uuidv4()}`;

    // 3. Create Event(s)
    const event: TeamCreatedEvent = {
      type: 'TeamCreated',
      entity: 'team',
      aggregateId: newTeamId,
      timestamp: new Date().toISOString(),
      payload: {
        id: newTeamId,
        companyId: command.companyId,
        name: command.name,
        purpose: command.purpose,
        context: command.context,
        level: command.level,
      },
    };

    // 4. Save Event(s) to Event Store
    await saveEvents([event]);

    // 5. Re-project from events to get the created state for the response
    const newTeamState = applyEventsToTeam(null, [event]);

    if (!newTeamState) {
      throw new Error('Failed to apply event to create team state.');
    }

    return NextResponse.json(newTeamState, { status: 201 });
  } catch (error) {
    console.error('Failed to create team:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// --- Vertical Slice: Update Team ---
export async function PUT(request: NextRequest) {
    try {
        // 1. Parse and Validate Command
        const command: UpdateTeamCommand = await request.json();
        if (!command.id || !command.name || !command.purpose) {
            return NextResponse.json({ message: 'ID, name, and purpose are required' }, { status: 400 });
        }

        // 2. Command Handler Logic
        const { id, name, purpose, context } = command;

        const existingTeam = await getTeamByIdProjection(id);
        if (!existingTeam) {
            return NextResponse.json({ message: 'Team not found' }, { status: 404 });
        }

        // 3. Create Event
        const event: TeamUpdatedEvent = {
            type: 'TeamUpdated',
            entity: 'team',
            aggregateId: id,
            timestamp: new Date().toISOString(),
            payload: {
                name,
                purpose,
                context,
            },
        };

        // 4. Save Event to Event Store
        await saveEvents([event]);

        // 5. Re-project all events for the aggregate to rebuild its state accurately for the response
        const allEventsForTeam = await getEventsFor(id);
        const updatedTeamState = applyEventsToTeam(null, allEventsForTeam);
        
        if (!updatedTeamState) {
            throw new Error('Failed to apply events to update team state.');
        }

        return NextResponse.json(updatedTeamState, { status: 200 });

    } catch (error) {
        console.error('Failed to update team:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
