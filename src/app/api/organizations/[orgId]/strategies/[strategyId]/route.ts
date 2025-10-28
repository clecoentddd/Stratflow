
import { NextResponse, NextRequest } from 'next/server';
import { saveEvents } from '@/lib/db/event-store';
import { getOrganizationByIdProjection } from '@/lib/db/projections';
import type { UpdateStrategyCommand } from '@/lib/domain/strategy/commands';
import type { StrategyStateUpdatedEvent } from '@/lib/domain/strategy/events';

// --- Vertical Slice: Update Strategy (e.g., change state) ---
export async function PUT(request: NextRequest, { params }: { params: { orgId: string, strategyId: string } }) {
  try {
    const { orgId, strategyId } = params;
    const command: UpdateStrategyCommand = await request.json();

    // 1. Validation
    const organization = await getOrganizationByIdProjection(orgId);
    if (!organization) {
      return NextResponse.json({ message: 'Organization not found' }, { status: 404 });
    }
    const strategy = organization.dashboard.strategies.find(s => s.id === strategyId);
    if (!strategy) {
      return NextResponse.json({ message: 'Strategy not found' }, { status: 404 });
    }
    if (!command.state) {
        return NextResponse.json({ message: 'No updateable fields provided' }, { status: 400 });
    }

    // 2. Create Event (only handling state changes for now)
    const eventsToSave = [];
    if (command.state && command.state !== strategy.state) {
        const event: StrategyStateUpdatedEvent = {
            type: 'StrategyStateUpdated',
            entity: 'organization',
            aggregateId: orgId,
            timestamp: new Date().toISOString(),
            payload: {
                strategyId: strategyId,
                state: command.state,
            },
        };
        eventsToSave.push(event);
    }
    
    // 3. Save Event(s)
    if (eventsToSave.length > 0) {
        await saveEvents(eventsToSave);
    }

    // 4. Respond
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Failed to update strategy:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
