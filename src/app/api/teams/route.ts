
import { NextResponse, NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getTeamsProjection, getTeamByIdProjection } from '@/lib/domain/teams/projection';
import { saveEvents } from '@/lib/db/event-store';
import type { CreateTeamCommand, UpdateTeamCommand } from '@/lib/domain/teams/commands';
import type { TeamCreatedEvent, TeamUpdatedEvent } from '@/lib/domain/teams/events';

// Keep GET behavior (teams list) — UI expects /api/teams to return teams projection.
export async function GET(request: NextRequest) {
  try {
    console.log('[api/teams] GET invoked', { url: request.url, headers: Object.fromEntries(request.headers) });
    const teams = await getTeamsProjection();
    console.log('[api/teams] returning teams count', teams.length);
    return NextResponse.json(teams);
  } catch (error) {
    console.error('Failed to get teams projection:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST and PUT are deprecated — respond with 410 to encourage flattened endpoints for team-scoped operations.
const removed = (method = 'request') =>
  NextResponse.json(
    {
      error: 'endpoint_removed',
      message:
        'This team-scoped API endpoint has been removed for write operations. Use flattened endpoints: /api/strategies, /api/initiatives, /api/initiative-items, /api/radar (pass teamId as query or in body).',
      method,
    },
    { status: 410 }
  );

export async function POST(request: NextRequest) {
  // Implement team creation to keep the UI flow working.
  try {
    const body = await request.json();
    const command = body as CreateTeamCommand;
    // Require name and level (level must be a number). purpose/context are optional.
    if (!command || !command.name || !command.companyId || typeof command.level !== 'number' || Number.isNaN(command.level)) {
      return NextResponse.json({ message: 'Invalid team create command: name, companyId and numeric level are required' }, { status: 400 });
    }

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

    await saveEvents([event]);

  console.log('[api/teams] created team', newTeamId, { companyId: command.companyId, name: command.name });

  // Return the created team projection
  const created = await getTeamByIdProjection(newTeamId);
  return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Failed to create team:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // Allow updating a team's basic fields so the EditTeamDialog works.
  try {
    const body = await request.json();
    const command = body as UpdateTeamCommand;
    if (!command || !command.id) {
      return NextResponse.json({ message: 'Invalid update command' }, { status: 400 });
    }

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

    await saveEvents([event]);

  console.log('[api/teams] updated team', command.id, { name: command.name });

  const updated = await getTeamByIdProjection(command.id);
  return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update team:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
