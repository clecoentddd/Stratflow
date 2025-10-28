
import { NextResponse, NextRequest } from 'next/server';
import { saveEvents } from '@/lib/db/event-store';
import { getOrganizationByIdProjection } from '@/lib/db/projections';
import type { UpdateInitiativeItemCommand, DeleteInitiativeItemCommand } from '@/lib/domain/strategy/commands';
import type { InitiativeItemUpdatedEvent, InitiativeItemDeletedEvent } from '@/lib/domain/strategy/events';

// --- Vertical Slice: Update Initiative Item ---
export async function PUT(request: NextRequest, { params }: { params: { orgId: string, itemId: string } }) {
  try {
    const { orgId, itemId } = params;
    const command: UpdateInitiativeItemCommand = await request.json();

    // 1. Validation
    const organization = await getOrganizationByIdProjection(orgId);
    if (!organization) return NextResponse.json({ message: 'Organization not found' }, { status: 404 });
    
    // Find which initiative this item belongs to
    const initiative = organization.dashboard.strategies
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
      entity: 'organization',
      aggregateId: orgId,
      timestamp: new Date().toISOString(),
      payload: {
        initiativeId: command.initiativeId,
        itemId: itemId,
        text: command.text,
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
export async function DELETE(request: NextRequest, { params }: { params: { orgId: string, itemId: string } }) {
  try {
    const { orgId, itemId } = params;
    // The body might be empty for a DELETE request, so we can't rely on it.
    // We get the initiative ID from the query parameter if needed, but it is not for this operation
    // as the item ID should be unique across the organization.

    // 1. Validation
     const organization = await getOrganizationByIdProjection(orgId);
    if (!organization) return NextResponse.json({ message: 'Organization not found' }, { status: 404 });

    const initiative = organization.dashboard.strategies
        .flatMap(s => s.initiatives)
        .find(i => i.steps.some(step => step.items.some(item => item.id === itemId)));

    if (!initiative) {
        return NextResponse.json({ message: 'Item not found in any initiative' }, { status: 404 });
    }

    // 2. Create Event
    const event: InitiativeItemDeletedEvent = {
      type: 'InitiativeItemDeleted',
      entity: 'organization',
      aggregateId: orgId,
      timestamp: new Date().toISOString(),
      payload: {
        initiativeId: initiative.id,
        itemId: itemId,
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

    