import { NextResponse, NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { saveEvents } from '@/lib/db/event-store';
import { getTeamByIdProjection } from '@/lib/db/projections';
import type { CreateInitiativeCommand, UpdateInitiativeCommand, DeleteInitiativeCommand } from '@/lib/domain/initiatives/commands';
import type { InitiativeCreatedEvent, InitiativeUpdatedEvent, InitiativeDeletedEvent } from '@/lib/domain/initiatives/events';
import { newInitiativeTemplate } from '@/lib/domain/initiatives/constants';

// Helper to extract teamId from query or body
async function resolveTeamId(request: NextRequest) {
  const queryTeam = request.nextUrl.searchParams.get('teamId');
  const body = await request.json().catch(() => undefined);
  return queryTeam ?? (body && (body.teamId as string | undefined));
}

// --- Vertical Slice: Create Initiative ---
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const teamId = request.nextUrl.searchParams.get('teamId') ?? body.teamId;
    const command: CreateInitiativeCommand = body;

    if (!teamId) return NextResponse.json({ message: 'teamId is required (query or body)' }, { status: 400 });

    // 1. Validation
    const team = await getTeamByIdProjection(teamId);
    if (!team) {
      return NextResponse.json({ message: 'Team not found' }, { status: 404 });
    }
    const strategy = team.dashboard.strategies.find(s => s.id === command.strategyId);
     if (!strategy) {
      return NextResponse.json({ message: 'Strategy not found' }, { status: 404 });
    }
    if (!command.name) {
      return NextResponse.json({ message: 'Initiative name is required' }, { status: 400 });
    }
    if (!command.tempId) {
        return NextResponse.json({ message: 'Temporary ID is required' }, { status: 400 });
    }

    // 2. Create Event
    const initiativeId = `init-${uuidv4()}`;
    const event: InitiativeCreatedEvent = {
      type: 'InitiativeCreated',
      entity: 'team',
      aggregateId: teamId,
      timestamp: new Date().toISOString(),
      payload: {
        strategyId: command.strategyId,
        initiativeId: initiativeId,
        tempId: command.tempId,
        name: command.name,
        template: {
          ...newInitiativeTemplate(initiativeId, command.name),
          linkedRadarItemIds: [] // Ensure this is never undefined
        },
      },
    };

    // 3. Save Event
    await saveEvents([event]);

    // 4. Create the complete initiative data
    const newInitiative = {
      ...event.payload.template,  // Base template
      created_at: event.timestamp,
      updated_at: event.timestamp,
    };

    // 5. Respond with complete data
    return NextResponse.json({ 
      success: true, 
      initiative: newInitiative
    }, { status: 201 });

  } catch (error) {
    console.error('Failed to create initiative:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// --- Vertical Slice: Update Initiative ---
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const teamId = request.nextUrl.searchParams.get('teamId') ?? body.teamId;
    const command: UpdateInitiativeCommand = body;

    if (!teamId) return NextResponse.json({ message: 'teamId is required (query or body)' }, { status: 400 });
    if (!command.initiativeId) return NextResponse.json({ message: 'initiativeId is required' }, { status: 400 });

    // 1. Validation
    const team = await getTeamByIdProjection(teamId);
    if (!team) {
      return NextResponse.json({ message: 'Team not found' }, { status: 404 });
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
      return NextResponse.json({ message: 'Initiative not found' }, { status: 404 });
    }

    // 2. Create Event
    const event: InitiativeUpdatedEvent = {
      type: 'InitiativeUpdated',
      entity: 'team',
      aggregateId: teamId,
      timestamp: new Date().toISOString(),
      payload: {
        initiativeId: command.initiativeId,
        name: command.name || foundInitiative.name,
      },
    };

    // 3. Save Event
    await saveEvents([event]);

    // 4. Respond
    return NextResponse.json({ 
      success: true, 
      message: 'Initiative updated successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to update initiative:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// --- Vertical Slice: Delete Initiative ---
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const teamId = request.nextUrl.searchParams.get('teamId') ?? body.teamId;
    const command: DeleteInitiativeCommand = body;

    if (!teamId) return NextResponse.json({ message: 'teamId is required (query or body)' }, { status: 400 });
    if (!command.initiativeId) return NextResponse.json({ message: 'initiativeId is required' }, { status: 400 });
    if (!command.strategyId) return NextResponse.json({ message: 'strategyId is required' }, { status: 400 });

    // 1. Validation
    const team = await getTeamByIdProjection(teamId);
    if (!team) {
      return NextResponse.json({ message: 'Team not found' }, { status: 404 });
    }

    const strategy = team.dashboard.strategies.find(s => s.id === command.strategyId);
    if (!strategy) {
      return NextResponse.json({ message: 'Strategy not found' }, { status: 404 });
    }

    const initiative = strategy.initiatives.find(i => i.id === command.initiativeId);
    if (!initiative) {
      return NextResponse.json({ message: 'Initiative not found' }, { status: 404 });
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

    // 4. Respond
    return NextResponse.json({ 
      success: true, 
      message: 'Initiative deleted successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to delete initiative:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
