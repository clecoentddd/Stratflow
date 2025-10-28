
import { NextResponse, NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { saveEvents } from '@/lib/db/event-store';
import { getOrganizationByIdProjection } from '@/lib/db/projections';
import type { AddInitiativeItemCommand } from '@/lib/domain/strategy/commands';
import type { InitiativeItemAddedEvent } from '@/lib/domain/strategy/events';
import type { InitiativeItem } from '@/lib/types';

// --- Vertical Slice: Add Initiative Item ---
export async function POST(request: NextRequest, { params }: { params: { orgId: string } }) {
  try {
    const { orgId } = params;
    const command: AddInitiativeItemCommand = await request.json();

    // 1. Validation
    const organization = await getOrganizationByIdProjection(orgId);
    if (!organization) {
      return NextResponse.json({ message: 'Organization not found' }, { status: 404 });
    }
    const initiative = organization.dashboard.strategies
        .flatMap(s => s.initiatives)
        .find(i => i.id === command.initiativeId);
    if (!initiative) {
        return NextResponse.json({ message: 'Initiative not found' }, { status: 404 });
    }
    if (!command.stepKey) {
        return NextResponse.json({ message: 'Step key is required' }, { status: 400 });
    }

    // 2. Create Event
    const newItem: InitiativeItem = {
        id: `item-${uuidv4()}`,
        text: "" // Start with empty text, to be edited by user
    };

    const event: InitiativeItemAddedEvent = {
      type: 'InitiativeItemAdded',
      entity: 'organization',
      aggregateId: orgId,
      timestamp: new Date().toISOString(),
      payload: {
        initiativeId: command.initiativeId,
        stepKey: command.stepKey,
        item: newItem,
      },
    };

    // 3. Save Event
    await saveEvents([event]);

    // 4. Respond
    return NextResponse.json({ success: true, item: newItem }, { status: 201 });

  } catch (error) {
    console.error('Failed to add initiative item:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
