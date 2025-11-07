import { NextResponse, NextRequest } from 'next/server';
import { saveEvents } from '@/lib/db/event-store';
import { getTeamByIdProjection } from '@/lib/db/projections';
import type { UpdateInitiativeItemCommand, DeleteInitiativeItemCommand } from '@/lib/domain/initiative-items/commands';
import type { InitiativeItemUpdatedEvent, InitiativeItemDeletedEvent } from '@/lib/domain/initiative-items/events';

// --- Vertical Slice: Update Initiative Item ---
export async function PUT(request: NextRequest, { params }: { params: { itemId: string } | Promise<{ itemId: string }> }) {
  try {
    const { itemId } = (await params) as { itemId: string };
    const body = await request.json();
    const teamId = request.nextUrl.searchParams.get('teamId') ?? body.teamId;
    const command: UpdateInitiativeItemCommand = body;

    if (!teamId) return NextResponse.json({ message: 'teamId is required (query or body)' }, { status: 400 });

    // 1. Validation
    const team = await getTeamByIdProjection(teamId);
    if (!team) return NextResponse.json({ message: 'Team not found' }, { status: 404 });
    
    // Find which initiative this item belongs to
    const initiative = team.dashboard.strategies
        .flatMap(s => s.initiatives)
        .find(i => i.steps.some(step => step.items.some(item => item.id === itemId)));

    if (!initiative) return NextResponse.json({ message: 'Item not found within any initiative' }, { status: 404 });
    
    // Command initiativeId must match found initiative
    if (command.initiativeId !== initiative.id) return NextResponse.json({ message: 'Item does not belong to specified initiative' }, { status: 400 });

    if (command.text === undefined || command.text.trim() === '') {
      return NextResponse.json({ message: 'Text is required for update' }, { status: 400 });
    }

    // 2. Create Event
    const event: InitiativeItemUpdatedEvent = {
      type: 'InitiativeItemUpdated',
      entity: 'team',
      aggregateId: teamId,
      timestamp: new Date().toISOString(),
      payload: {
        text: command.text,
      },
      metadata: {
        initiativeId: command.initiativeId,
        itemId: itemId,
        teamId: teamId,
      },
    };

    // 3. Save Event
    await saveEvents([event]);

    // 4. Respond
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Failed to update initiative item:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}


// --- Vertical Slice: Delete Initiative Item ---
export async function DELETE(request: NextRequest, { params }: { params: { itemId: string } | Promise<{ itemId: string }> }) {
  try {
    const { itemId } = (await params) as { itemId: string };
    const body = await request.json().catch(() => ({}));
    const teamId = request.nextUrl.searchParams.get('teamId') ?? (body && (body.teamId as string | undefined));

    if (!teamId) return NextResponse.json({ message: 'teamId is required (query or body)' }, { status: 400 });

    // 1. Validation
     const team = await getTeamByIdProjection(teamId);
    if (!team) return NextResponse.json({ message: 'Team not found' }, { status: 404 });

    const initiative = team.dashboard.strategies
        .flatMap(s => s.initiatives)
        .find(i => i.steps.some(step => step.items.some(item => item.id === itemId)));

    if (!initiative) {
        return NextResponse.json({ message: 'Item not found in any initiative' }, { status: 404 });
    }

    // 2. Create Event
    const event: InitiativeItemDeletedEvent = {
      type: 'InitiativeItemDeleted',
      entity: 'team',
      aggregateId: teamId,
      timestamp: new Date().toISOString(),
      payload: {},
      metadata: {
        initiativeId: initiative.id,
        itemId: itemId,
        teamId: teamId,
      },
    };

    // 3. Save Event
    await saveEvents([event]);

    // 4. Respond
    return NextResponse.json({ success: true }, { status: 200 });
    
  } catch (error) {
    console.error('Failed to delete initiative item:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
