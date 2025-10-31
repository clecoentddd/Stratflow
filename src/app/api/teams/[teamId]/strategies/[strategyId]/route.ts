
import { NextResponse, NextRequest } from 'next/server';
import { saveEvents, getEventsByEntityAndId } from '@/lib/db/event-store';
import { getTeamByIdProjection } from '@/lib/db/projections';
import type { UpdateStrategyCommand } from '@/lib/domain/strategies/commands';
import { StrategyCommandHandlers } from '@/lib/domain/strategies/command-handlers';

// --- Vertical Slice: Update Strategy ---
export async function PUT(request: NextRequest, { params }: { params: { teamId: string, strategyId: string } | Promise<{ teamId: string, strategyId: string }> }) {
  try {
    const { teamId, strategyId } = (await params) as { teamId: string, strategyId: string };
    const command: UpdateStrategyCommand = await request.json();

    // 1. Basic validation
    const hasUpdateableField = command.state || command.description || command.timeframe;
    if (!hasUpdateableField) {
        return NextResponse.json({ message: 'No updateable fields provided' }, { status: 400 });
    }

    // 2. Get events and handle command
    const events = await getEventsByEntityAndId('team', teamId);
    const result = StrategyCommandHandlers.handleUpdateStrategy(
      teamId,
      { ...command, strategyId },
      events
    );
    
    if (!result.success || !result.event) {
      return NextResponse.json({ message: result.error }, { status: 409 });
    }

    // 3. Save Event
    await saveEvents([result.event]);

    // 4. Respond
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Failed to update strategy:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
