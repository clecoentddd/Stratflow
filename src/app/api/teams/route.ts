
import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getTeamsProjection } from '@/lib/domain/teams/projection';
import { getUsersProjection } from '@/lib/domain/userManagement/user-projection';
import type { CreateTeamCommand, UpdateTeamCommand } from '@/lib/domain/teams/commands';
import { TeamsCommandHandlers } from '@/lib/domain/teams/commandHandler';

// Keep GET behavior (teams list) — UI expects /api/teams to return teams projection.
export async function GET(request: NextRequest) {
  try {
    console.log('[api/teams] GET invoked', { url: request.url, headers: Object.fromEntries(request.headers) });
    const { searchParams } = request.nextUrl;
    let companyId = searchParams.get('companyId');

    const users = await getUsersProjection();
    const cookieStore = await cookies();
    const userIdFromCookie = cookieStore.get('userId')?.value;
    let user;
    if (userIdFromCookie) {
      user = users.find(u => u.userId === userIdFromCookie);
    }

    // If no companyId provided, default to user's company
    if (!companyId && user?.companyId) {
      companyId = user.companyId;
    }

    let teams = await getTeamsProjection();

    if (companyId) {
      teams = teams.filter(t => t.companyId === companyId);
    }

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

    const users = await getUsersProjection();
    const cookieStore = await cookies();
    const userIdFromCookie = cookieStore.get('userId')?.value;
    let user;
    if (userIdFromCookie) {
      user = users.find(u => u.userId === userIdFromCookie);
    }

    // Enforce companyId from user context: users can only create teams for their primary organization
    if (user?.companyId) {
      if (command.companyId && command.companyId !== user.companyId) {
        return NextResponse.json({
          message: `Access Denied: You are attempting to create a team for an organization outside of your primary workspace (${user.companyId}). Please switch to the correct company context or contact a system administrator.`
        }, { status: 403 });
      }
      command.companyId = user.companyId;
    }

    const created = await TeamsCommandHandlers.handleCreateTeam(command);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Failed to create team:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    const status = message.includes('Invalid team create command') ? 400 : 500;
    return NextResponse.json({ message }, { status });
  }
}

export async function PUT(request: NextRequest) {
  // Allow updating a team's basic fields so the EditTeamDialog works.
  try {
    const body = await request.json();
    const command = body as UpdateTeamCommand;

    const updated = await TeamsCommandHandlers.handleUpdateTeam(command);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update team:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    const status = message.includes('Invalid update command') ? 400 : 500;
    return NextResponse.json({ message }, { status });
  }
}
