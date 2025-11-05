import { NextResponse, NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { saveEvents } from '@/lib/db/event-store';
import { getTeamByIdProjection } from '@/lib/db/projections';
import type { CreateInitiativeCommand } from '@/lib/domain/initiatives/commands';
import type { InitiativeCreatedEvent } from '@/lib/domain/initiatives/events';
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
