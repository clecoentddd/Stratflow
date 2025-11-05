import { NextResponse, NextRequest } from 'next/server';
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

    const result = await StrategyCommandHandlers.handleCreateStrategyCommand(teamId, command);
    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error('Failed to create strategy:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    const status = message.includes('required') || message.includes('Cannot create') ? 409 : 500;
    return NextResponse.json({ message }, { status });
  }
}
