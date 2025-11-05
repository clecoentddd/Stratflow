import { NextResponse, NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  getTeamByIdProjection,
  applyEventsToTeam,
} from '@/lib/db/projections';
import { saveEvents, _getAllEvents } from '@/lib/db/event-store';
import type { UpsertRadarItemCommand } from '@/lib/domain/radar/commands';
import type { RadarItemCreatedEvent, RadarItemUpdatedEvent, RadarItemDeletedEvent } from '@/lib/domain/radar/events';

// Helper function to get events for a specific team
const getEventsForTeam = async (teamId: string) => {
  const allEvents = await _getAllEvents();
  return allEvents.filter(event => event.aggregateId === teamId && event.entity === 'team') as any[];
};

// --- Vertical Slice: Get Radar (teamId via query or body)
export async function GET(request: NextRequest) {
  try {
    const teamId = request.nextUrl.searchParams.get('teamId');
    if (!teamId) return NextResponse.json({ message: 'teamId is required (query param)' }, { status: 400 });
    const team = await getTeamByIdProjection(teamId);
    if (!team) {
      return NextResponse.json({ message: 'Team not found' }, { status: 404 });
    }
    return NextResponse.json(team);
  } catch (error) {
    console.error('Failed to get radar items:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}


// --- Vertical Slice: Create Radar Item ---
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const teamId = request.nextUrl.searchParams.get('teamId') ?? body.teamId;
    const command: UpsertRadarItemCommand = body;
    
    if (!teamId) return NextResponse.json({ message: 'teamId is required (query or body)' }, { status: 400 });

    // 1. Command Handler Logic (Validation)
    const team = await getTeamByIdProjection(teamId);
    if (!team) {
      return NextResponse.json({ message: 'Team not found' }, { status: 404 });
    }
    if (!command.name) {
        return NextResponse.json({ message: 'Radar item name is required' }, { status: 400 });
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

    // 4. Re-project to get the latest state for the response
    const allEventsForTeam = await getEventsForTeam(teamId);
    const updatedTeamState = applyEventsToTeam(null, allEventsForTeam);

    if (!updatedTeamState) {
      throw new Error('Failed to apply event to create radar item.');
    }
    
    return NextResponse.json(updatedTeamState, { status: 201 });
  } catch (error) {
    console.error('Failed to create radar item:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// --- Vertical Slice: Update Radar Item ---
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const teamId = request.nextUrl.searchParams.get('teamId') ?? body.teamId;
        const command: UpsertRadarItemCommand = body;
        
        if (!teamId) return NextResponse.json({ message: 'teamId is required (query or body)' }, { status: 400 });

        // 1. Command Handler Logic (Validation)
        const team = await getTeamByIdProjection(teamId);
        if (!team) {
          return NextResponse.json({ message: 'Team not found' }, { status: 404 });
        }
        const existingItem = team.radar.find(item => item.id === command.id);
        if(!existingItem) {
            return NextResponse.json({ message: 'Radar item not found' }, { status: 404 });
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
        
        // 4. Re-project to get the latest state for the response
        const allEventsForTeam = await getEventsForTeam(teamId);
        const updatedTeamState = applyEventsToTeam(null, allEventsForTeam);

        if (!updatedTeamState) {
            throw new Error('Failed to apply event to update radar item.');
        }

        return NextResponse.json(updatedTeamState, { status: 200 });

    } catch (error) {
        console.error('Failed to update radar item:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}


// --- Vertical Slice: Delete Radar Item ---
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const teamId = request.nextUrl.searchParams.get('teamId') ?? (body && (body.teamId as string | undefined));
        const { id: itemId } = body;

        if (!teamId) return NextResponse.json({ message: 'teamId is required (query or body)' }, { status: 400 });
        if (!itemId) return NextResponse.json({ message: 'Radar item ID is required' }, { status: 400 });

        // 1. Command Handler Logic (Validation)
        const team = await getTeamByIdProjection(teamId);
        if (!team) {
            return NextResponse.json({ message: 'Team not found' }, { status: 404 });
        }
        if(!team.radar.find(item => item.id === itemId)) {
            return NextResponse.json({ message: 'Radar item not found' }, { status: 404 });
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
        
        // 4. Re-project to get the latest state for the response
        const allEventsForTeam = await getEventsForTeam(teamId);
        const updatedTeamState = applyEventsToTeam(null, allEventsForTeam);

        if(!updatedTeamState) {
             throw new Error('Failed to apply delete event to radar item.');
        }

        return NextResponse.json(updatedTeamState, { status: 200 });

    } catch (error) {
        console.error('Failed to delete radar item:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
