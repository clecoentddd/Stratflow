import { NextResponse, NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { saveEvents } from '@/lib/db/event-store';
import { getTeamByIdProjection } from '@/lib/db/projections';
import type { AddInitiativeItemCommand } from '@/lib/domain/initiative-items/commands';
import type { InitiativeItemAddedEvent } from '@/lib/domain/initiative-items/events';
import type { InitiativeItem } from '@/lib/types';

// --- Vertical Slice: Add Initiative Item ---
export async function POST(request: NextRequest) {
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
    // Find initiative by real ID or temporary ID
    const initiative = team.dashboard.strategies
        .flatMap(s => s.initiatives)
        .find(i => i.id === command.initiativeId || i.tempId === command.initiativeId);
        
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
    const newItem: InitiativeItem = {
        id: `item-${uuidv4()}`,
        text: command.item.text // Use the text from the command
    };

    const event: InitiativeItemAddedEvent = {
      type: 'InitiativeItemAdded',
      entity: 'team',
      aggregateId: teamId,
      timestamp: new Date().toISOString(),
      payload: {
        initiativeId: initiative.id, // Use the real ID for the event
        stepKey: command.stepKey,
        item: newItem,
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
