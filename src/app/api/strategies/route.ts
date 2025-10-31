import { NextResponse, NextRequest } from 'next/server';
import { saveEvents, getEventsByEntityAndId } from '@/lib/db/event-store';
import { StrategyCommandHandlers } from '@/lib/domain/strategies/command-handlers';
import type { CreateStrategyCommand } from '@/lib/domain/strategies/commands';

// POST /api/strategies?teamId=team-xyz  OR body.teamId
export async function POST(request: NextRequest) {
  try {
    const queryTeam = request.nextUrl.searchParams.get('teamId');
    const body = await request.json().catch(() => ({}));
    const teamId = queryTeam ?? (body && (body.teamId as string | undefined));
    const command: CreateStrategyCommand = body;

    if (!teamId) return NextResponse.json({ message: 'teamId is required (query or body)' }, { status: 400 });

    // 1. Basic validation
    if (!command.description || !command.timeframe) {
      return NextResponse.json({ message: 'Description and timeframe are required' }, { status: 400 });
    }

    // 2. Get events and handle command
    const events = await getEventsByEntityAndId('team', teamId);
    const result = StrategyCommandHandlers.handleCreateStrategy(teamId, command, events as any);
    
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
