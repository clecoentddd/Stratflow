
import { NextResponse, NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { saveEvents } from '@/lib/db/event-store';
import { getOrganizationByIdProjection } from '@/lib/db/projections';
import type { CreateInitiativeCommand } from '@/lib/domain/strategy/commands';
import type { InitiativeCreatedEvent } from '@/lib/domain/strategy/events';
import { newInitiativeTemplate } from '@/lib/data';

// --- Vertical Slice: Create Initiative ---
export async function POST(request: NextRequest, { params }: { params: { orgId: string } }) {
  try {
    const { orgId } = params;
    const command: CreateInitiativeCommand = await request.json();

    // 1. Validation
    const organization = await getOrganizationByIdProjection(orgId);
    if (!organization) {
      return NextResponse.json({ message: 'Organization not found' }, { status: 404 });
    }
    const strategy = organization.dashboard.strategies.find(s => s.id === command.strategyId);
     if (!strategy) {
      return NextResponse.json({ message: 'Strategy not found' }, { status: 404 });
    }
    if (!command.name) {
      return NextResponse.json({ message: 'Initiative name is required' }, { status: 400 });
    }

    // 2. Create Event
    const initiativeId = `init-${uuidv4()}`;
    const event: InitiativeCreatedEvent = {
      type: 'InitiativeCreated',
      entity: 'organization',
      aggregateId: orgId,
      timestamp: new Date().toISOString(),
      payload: {
        strategyId: command.strategyId,
        initiativeId: initiativeId,
        name: command.name,
        template: newInitiativeTemplate(initiativeId, command.name),
      },
    };

    // 3. Save Event
    await saveEvents([event]);

    // 4. Respond
    return NextResponse.json({ success: true, initiativeId }, { status: 201 });

  } catch (error) {
    console.error('Failed to create initiative:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
