import { NextResponse, NextRequest } from 'next/server';
import { saveEvents } from '@/lib/db/event-store';
import { StrategyCommandHandlers } from '@/lib/domain/strategies/command-handlers';
import type { UpdateStrategyCommand } from '@/lib/domain/strategies/commands';

// PUT /api/strategies/:strategyId?teamId=team-xyz  OR body.teamId
export async function PUT(request: NextRequest, { params }: { params: { strategyId: string } | Promise<{ strategyId: string }> }) {
  try {
    const { strategyId } = (await params) as { strategyId: string };
    const body = await request.json().catch(() => ({}));
    const teamId = request.nextUrl.searchParams.get('teamId') ?? (body && (body.teamId as string | undefined));
    const command: UpdateStrategyCommand = body;

    if (!teamId) return NextResponse.json({ message: 'teamId is required (query or body)' }, { status: 400 });

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
      events as any
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
