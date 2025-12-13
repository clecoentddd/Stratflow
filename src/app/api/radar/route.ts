import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getTeamByIdProjection } from '@/lib/db/projections';
import { getUsersProjection } from '@/lib/domain/userManagement/user-projection';
import type { UpsertRadarItemCommand } from '@/lib/domain/radar/commands';
import { RadarCommandHandlers } from '@/lib/domain/radar/commandHandler';

async function checkTenancy(teamId: string) {
    const team = await getTeamByIdProjection(teamId);
    if (!team) return { error: 'Team not found', status: 404 };

    const users = await getUsersProjection();
    const cookieStore = await cookies();
    const userIdFromCookie = cookieStore.get('userId')?.value;
    let user;
    if (userIdFromCookie) {
        user = users.find(u => u.userId === userIdFromCookie);
    }

    if (user?.companyId && team.companyId && team.companyId !== user.companyId) {
        return { error: 'Unauthorized access to team', status: 403 };
    }
    return null;
}

// --- Vertical Slice: Get Radar (teamId via query or body)
export async function GET(request: NextRequest) {
  try {
    const teamId = request.nextUrl.searchParams.get('teamId');
    if (!teamId) return NextResponse.json({ message: 'teamId is required (query param)' }, { status: 400 });
    
    const tenancyCheck = await checkTenancy(teamId);
    if (tenancyCheck) return NextResponse.json({ message: tenancyCheck.error }, { status: tenancyCheck.status });

    const team = await getTeamByIdProjection(teamId);
    // team is guaranteed to exist if checkTenancy passed (or checkTenancy handles 404)
    // but checkTenancy returns error if not found, so we can safely assume it exists or re-fetch
    // Actually checkTenancy fetches it. We could optimize but this is fine.
    
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

    const tenancyCheck = await checkTenancy(teamId);
    if (tenancyCheck) return NextResponse.json({ message: tenancyCheck.error }, { status: tenancyCheck.status });

    const result = await RadarCommandHandlers.handleCreateRadarItem(teamId, command);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Failed to create radar item:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    const status = ['Team not found', 'Radar item name is required'].includes(message) ? 400 : 500;
    return NextResponse.json({ message }, { status });
  }
}

// --- Vertical Slice: Update Radar Item ---
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const teamId = request.nextUrl.searchParams.get('teamId') ?? body.teamId;
        const command: UpsertRadarItemCommand = body;
        
        if (!teamId) return NextResponse.json({ message: 'teamId is required (query or body)' }, { status: 400 });

        const tenancyCheck = await checkTenancy(teamId);
        if (tenancyCheck) return NextResponse.json({ message: tenancyCheck.error }, { status: tenancyCheck.status });

        const updatedTeamState = await RadarCommandHandlers.handleUpdateRadarItem(teamId, command);

        return NextResponse.json(updatedTeamState, { status: 200 });

    } catch (error) {
        console.error('Failed to update radar item:', error);
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        const status = ['Team not found', 'Radar item not found'].includes(message) ? 404 : 500;
        return NextResponse.json({ message }, { status });
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

        const tenancyCheck = await checkTenancy(teamId);
        if (tenancyCheck) return NextResponse.json({ message: tenancyCheck.error }, { status: tenancyCheck.status });

        const updatedTeamState = await RadarCommandHandlers.handleDeleteRadarItem(teamId, itemId);

        return NextResponse.json(updatedTeamState, { status: 200 });

    } catch (error) {
        console.error('Failed to delete radar item:', error);
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        const status = ['Team not found', 'Radar item not found'].includes(message) ? 404 : 500;
        return NextResponse.json({ message }, { status });
    }
}
