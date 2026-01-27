import { NextRequest } from 'next/server';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/response';
import { StrategyCommandHandlers } from '@/lib/domain/strategies/command-handlers';
import type { UpdateStrategyCommand } from '@/lib/domain/strategies/commands';

// PUT /api/strategies/:strategyId?teamId=team-xyz  OR body.teamId
export async function PUT(request: NextRequest, { params }: { params: { strategyId: string } | Promise<{ strategyId: string }> }) {
  try {
    const { strategyId } = (await params) as { strategyId: string };
    const body = await request.json().catch(() => ({}));
    const teamId = request.nextUrl.searchParams.get('teamId') ?? (body && (body.teamId as string | undefined));
    const command: UpdateStrategyCommand = { ...body, strategyId };

    if (!teamId) {
      return errorResponse('teamId is required (query or body)', 400);
    }

    const result = await StrategyCommandHandlers.handleUpdateStrategyCommand(teamId, command);
    return successResponse(result, 200);

  } catch (error) {
    return handleApiError(error);
  }
}
