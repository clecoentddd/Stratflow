
import { NextResponse, NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { saveEvents } from '@/lib/db/event-store';
import { getOrganizationByIdProjection } from '@/lib/db/projections';
import type { CreateStrategyCommand } from '@/lib/domain/strategy/commands';
import type { StrategyCreatedEvent } from '@/lib/domain/strategy/events';

// --- Vertical Slice: Create Strategy ---
export async function POST(request: NextRequest, { params }: { params: { orgId: string } }) {
  try {
    const { orgId } = params;
    const command: CreateStrategyCommand = await request.json();

    // 1. Validation
    const organization = await getOrganizationByIdProjection(orgId);
    if (!organization) {
      return NextResponse.json({ message: 'Organization not found' }, { status: 404 });
    }
    if (!command.description || !command.timeframe) {
      return NextResponse.json({ message: 'Description and timeframe are required' }, { status: 400 });
    }

    // 2. Create Event
    const event: StrategyCreatedEvent = {
      type: 'StrategyCreated',
      entity: 'organization',
      aggregateId: orgId,
      timestamp: new Date().toISOString(),
      payload: {
        strategyId: `strat-${uuidv4()}`,
        description: command.description,
        timeframe: command.timeframe,
      },
    };

    // 3. Save Event
    await saveEvents([event]);

    // 4. Respond
    // The projection will be rebuilt on the next GET request, so we can just return success.
    return NextResponse.json({ success: true, strategyId: event.payload.strategyId }, { status: 201 });

  } catch (error) {
    console.error('Failed to create strategy:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
