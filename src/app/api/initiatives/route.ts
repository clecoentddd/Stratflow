import { NextRequest } from 'next/server';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/response';
import { cookies } from 'next/headers';
import type { CreateInitiativeCommand, UpdateInitiativeCommand, DeleteInitiativeCommand } from '@/lib/domain/initiatives/commands';
import { InitiativesCommandHandlers } from '@/lib/domain/initiatives/commandHandler';
import { ensureProjectionHandlersLoaded } from '@/lib/db/event-store';
import { getTeamByIdProjection } from '@/lib/db/projections';
import { getUsersProjection } from '@/lib/domain/userManagement/user-projection';

async function checkTenancy(teamId: string) {
  const team = await getTeamByIdProjection(teamId);
  if (!team) return { error: 'Team not found', status: 404 };

  const users = await getUsersProjection();
  const cookieStore = await cookies();
  const userIdFromCookie = cookieStore.get('userId')?.value;
  let user;
  if (userIdFromCookie) {
    user = users.find(u => u.userId === userIdFromCookie);
  }

  if (user?.companyId && team.companyId && team.companyId !== user.companyId) {
    return { error: 'Unauthorized access to team', status: 403 };
  }
  return null;
}

// --- Vertical Slice: Create Initiative ---
export async function POST(request: NextRequest) {
  await ensureProjectionHandlersLoaded();
  try {
    const body = await request.json();
    const teamId = request.nextUrl.searchParams.get('teamId') ?? body.teamId;
    const tempId = body.tempId;
    const command: CreateInitiativeCommand = body;

    if (!teamId) return errorResponse('teamId is required (query or body)', 400);

    const tenancyCheck = await checkTenancy(teamId);
    if (tenancyCheck) return errorResponse(tenancyCheck.error, tenancyCheck.status);

    const result = await InitiativesCommandHandlers.handleCreateInitiative(teamId, command);
    // Return the real initiative id and the tempId for frontend reconciliation
    return successResponse({ ...result, tempId }, 201);

  } catch (error) {
    console.error('Failed to create initiative:', error);
    return handleApiError(error);
  }
}

// --- Vertical Slice: Update Initiative ---
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const teamId = request.nextUrl.searchParams.get('teamId') ?? body.teamId;
    const command: UpdateInitiativeCommand = body;

    if (!teamId) return errorResponse('teamId is required (query or body)', 400);

    const tenancyCheck = await checkTenancy(teamId);
    if (tenancyCheck) return errorResponse(tenancyCheck.error, tenancyCheck.status);

    const result = await InitiativesCommandHandlers.handleUpdateInitiative(teamId, command);
    return successResponse(result);

  } catch (error) {
    console.error('Failed to update initiative:', error);
    return handleApiError(error);
  }
}

// --- Vertical Slice: Delete Initiative ---
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const teamId = request.nextUrl.searchParams.get('teamId') ?? body.teamId;
    const command: DeleteInitiativeCommand = body;

    if (!teamId) return errorResponse('teamId is required (query or body)', 400);

    const tenancyCheck = await checkTenancy(teamId);
    if (tenancyCheck) return errorResponse(tenancyCheck.error, tenancyCheck.status);

    const result = await InitiativesCommandHandlers.handleDeleteInitiative(teamId, command);
    return successResponse(result);

  } catch (error) {
    console.error('Failed to delete initiative:', error);
    return handleApiError(error);
  }
}
