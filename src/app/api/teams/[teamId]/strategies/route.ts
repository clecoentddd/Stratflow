
import { NextResponse, NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { saveEvents } from '@/lib/db/event-store';
import { getTeamByIdProjection } from '@/lib/db/projections';
import type { CreateStrategyCommand } from '@/lib/domain/strategies/commands';
import type { StrategyCreatedEvent } from '@/lib/domain/strategy/events';

// --- Vertical Slice: Create Strategy ---
export async function POST(request: NextRequest, { params }: { params: { teamId: string } }) {
  try {
    const { teamId } = params;
    const command: CreateStrategyCommand = await request.json();

    // 1. Validation
    const team = await getTeamByIdProjection(teamId);
    if (!team) {
      return NextResponse.json({ message: 'Team not found' }, { status: 404 });
    }
    if (!command.description || !command.timeframe) {
      return NextResponse.json({ message: 'Description and timeframe are required' }, { status: 400 });
    }

    // 2. Create Event
    const event: StrategyCreatedEvent = {
      type: 'StrategyCreated',
      entity: 'team',
      aggregateId: teamId,
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
