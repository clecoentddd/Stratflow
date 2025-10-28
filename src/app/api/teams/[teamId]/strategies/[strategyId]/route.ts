
import { NextResponse, NextRequest } from 'next/server';
import { saveEvents } from '@/lib/db/event-store';
import { getTeamByIdProjection } from '@/lib/db/projections';
import type { UpdateStrategyCommand } from '@/lib/domain/strategy/commands';
import type { StrategyUpdatedEvent } from '@/lib/domain/strategy/events';

// --- Vertical Slice: Update Strategy ---
export async function PUT(request: NextRequest, { params }: { params: { teamId: string, strategyId: string } }) {
  try {
    const { teamId, strategyId } = params;
    const command: UpdateStrategyCommand = await request.json();

    // 1. Validation
    const team = await getTeamByIdProjection(teamId);
    if (!team) {
      return NextResponse.json({ message: 'Team not found' }, { status: 404 });
    }
    const strategy = team.dashboard.strategies.find(s => s.id === strategyId);
    if (!strategy) {
      return NextResponse.json({ message: 'Strategy not found' }, { status: 404 });
    }
    
    // Command can come from state change (no description/timeframe) or dialog (all fields)
    const hasUpdateableField = command.state || command.description || command.timeframe;
    if (!hasUpdateableField) {
        return NextResponse.json({ message: 'No updateable fields provided' }, { status: 400 });
    }

    // 2. Create Event
    const payload: Partial<StrategyUpdatedEvent['payload']> = { strategyId };
    let hasChanges = false;
    
    if (command.state && command.state !== strategy.state) {
        payload.state = command.state;
        hasChanges = true;
    }
    if (command.description && command.description !== strategy.description) {
        payload.description = command.description;
        hasChanges = true;
    }
    if (command.timeframe && command.timeframe !== strategy.timeframe) {
        payload.timeframe = command.timeframe;
        hasChanges = true;
    }

    if (!hasChanges) {
        return NextResponse.json({ message: 'No changes detected' }, { status: 200 });
    }

    const event: StrategyUpdatedEvent = {
        type: 'StrategyUpdated',
        entity: 'team',
        aggregateId: teamId,
        timestamp: new Date().toISOString(),
        payload: payload as StrategyUpdatedEvent['payload'], // We ensure it's not empty
    };
    
    // 3. Save Event
    await saveEvents([event]);

    // 4. Respond
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Failed to update strategy:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
