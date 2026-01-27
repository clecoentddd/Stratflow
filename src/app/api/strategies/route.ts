import { NextRequest } from 'next/server';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/response';
import { StrategyCommandHandlers } from '@/lib/domain/strategies/command-handlers';
import type { CreateStrategyCommand } from '@/lib/domain/strategies/commands';

// POST /api/strategies?teamId=team-xyz  OR body.teamId
export async function POST(request: NextRequest) {
  try {
    const queryTeam = request.nextUrl.searchParams.get('teamId');
    const body = await request.json().catch(() => ({}));
    const teamId = queryTeam ?? (body && (body.teamId as string | undefined));
    const command: CreateStrategyCommand = body;

    if (!teamId) {
      return errorResponse('teamId is required (query or body)', 400);
    }

    const result = await StrategyCommandHandlers.handleCreateStrategyCommand(teamId, command);
    return successResponse(result, 201);

  } catch (error) {
    return handleApiError(error);
  }
}
