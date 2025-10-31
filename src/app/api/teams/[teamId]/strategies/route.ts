
import { NextResponse, NextRequest } from 'next/server';
import { saveEvents, getEventsByEntityAndId } from '@/lib/db/event-store';
import { getTeamByIdProjection } from '@/lib/db/projections';
import type { CreateStrategyCommand } from '@/lib/domain/strategies/commands';
import { StrategyCommandHandlers } from '@/lib/domain/strategies/command-handlers';

// --- Vertical Slice: Create Strategy ---
export async function POST(request: NextRequest, { params }: { params: { teamId: string } | Promise<{ teamId: string }> }) {
  try {
    const { teamId } = (await params) as { teamId: string };
    const command: CreateStrategyCommand = await request.json();

    // 1. Basic validation
    if (!command.description || !command.timeframe) {
      return NextResponse.json({ message: 'Description and timeframe are required' }, { status: 400 });
    }

    // 2. Get events and handle command
    const events = await getEventsByEntityAndId('team', teamId);
    const result = StrategyCommandHandlers.handleCreateStrategy(teamId, command, events);
    
    if (!result.success || !result.event) {
      return NextResponse.json({ message: result.error }, { status: 409 });
    }

    // 3. Save Event
    await saveEvents([result.event]);

    // 4. Respond
    return NextResponse.json({ 
      success: true, 
      strategyId: result.event.payload.strategyId 
    }, { status: 201 });

  } catch (error) {
    console.error('Failed to create strategy:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
