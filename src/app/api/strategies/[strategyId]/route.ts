import { NextResponse, NextRequest } from 'next/server';
import { StrategyCommandHandlers } from '@/lib/domain/strategies/command-handlers';
import type { UpdateStrategyCommand } from '@/lib/domain/strategies/commands';

// PUT /api/strategies/:strategyId?teamId=team-xyz  OR body.teamId
export async function PUT(request: NextRequest, { params }: { params: { strategyId: string } | Promise<{ strategyId: string }> }) {
  try {
    const { strategyId } = (await params) as { strategyId: string };
    const body = await request.json().catch(() => ({}));
    const teamId = request.nextUrl.searchParams.get('teamId') ?? (body && (body.teamId as string | undefined));
    const command: UpdateStrategyCommand = { ...body, strategyId };

    if (!teamId) return NextResponse.json({ message: 'teamId is required (query or body)' }, { status: 400 });

    const result = await StrategyCommandHandlers.handleUpdateStrategyCommand(teamId, command);
    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Failed to update strategy:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    const status = message.includes('required') || message.includes('Cannot set') ? 409 : 500;
    return NextResponse.json({ message }, { status });
  }
}
