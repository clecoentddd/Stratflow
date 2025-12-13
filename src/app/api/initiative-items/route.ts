import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { saveEvents, ensureProjectionHandlersLoaded } from '@/lib/db/event-store';
import { getTeamByIdProjection } from '@/lib/db/projections';
import { getUsersProjection } from '@/lib/domain/userManagement/user-projection';
import type { AddInitiativeItemCommand } from '@/lib/domain/initiative-items/commands';
import type { InitiativeItemAddedEvent } from '@/lib/domain/initiative-items/events';
import type { InitiativeItem } from '@/lib/types';

// --- Vertical Slice: Add Initiative Item ---
export async function POST(request: NextRequest) {
  await ensureProjectionHandlersLoaded();
  try {
    const body = await request.json();
    const teamId = request.nextUrl.searchParams.get('teamId') ?? body.teamId;
    const command: AddInitiativeItemCommand = body;

    if (!teamId) return NextResponse.json({ message: 'teamId is required (query or body)' }, { status: 400 });

    // 1. Validation
    const team = await getTeamByIdProjection(teamId);
    if (!team) {
      return NextResponse.json({ message: 'Team not found' }, { status: 404 });
    }

    // Check tenancy
    const users = await getUsersProjection();
    const cookieStore = await cookies();
    const userIdFromCookie = cookieStore.get('userId')?.value;
    let user;
    if (userIdFromCookie) {
        user = users.find(u => u.userId === userIdFromCookie);
    }

    if (user?.companyId && team.companyId && team.companyId !== user.companyId) {
        return NextResponse.json({ message: 'Unauthorized access to team' }, { status: 403 });
    }

    // Find initiative by ID
    const initiative = team.dashboard.strategies
        .flatMap(s => s.initiatives)
        .find(i => i.id === command.initiativeId);
        
    if (!initiative) {
        return NextResponse.json({ message: 'Initiative not found' }, { status: 404 });
    }
    if (!command.stepKey) {
        return NextResponse.json({ message: 'Step key is required' }, { status: 400 });
    }
    if (!command.item || typeof command.item.text !== 'string' || command.item.text.trim() === '') {
        return NextResponse.json({ message: 'Item text is required' }, { status: 400 });
    }


    // 2. Create Event
    const itemId = `item-${uuidv4()}`;
    const newItem: InitiativeItem = {
        id: itemId,
        text: command.item.text // Use the text from the command
    };

    const event: InitiativeItemAddedEvent = {
      type: 'InitiativeItemAdded',
      entity: 'team',
      aggregateId: teamId,
      timestamp: new Date().toISOString(),
      payload: {
        stepKey: command.stepKey,
        item: { text: command.item.text }, // Only business data in payload
      },
      metadata: {
        initiativeId: initiative.id, // Use the real ID for the event
        itemId: itemId,
        teamId: teamId,
      },
    };

    // 3. Save Event
    await saveEvents([event]);

    // 4. Respond with the created item
    return NextResponse.json(newItem, { status: 201 });

  } catch (error) {
    console.error('Failed to add initiative item:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
