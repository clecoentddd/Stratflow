import { NextRequest } from 'next/server';
import { TagAnInitiativeWithARiskCommandHandler } from '@/lib/domain/tag-an-initiative-with-a-risk/commandHandler';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/response';

export async function POST(
    request: NextRequest,
    { params }: { params: { initiativeId: string } | Promise<{ initiativeId: string }> }
) {
    try {
        const { initiativeId } = (await params) as { initiativeId: string };
        const body = await request.json();
        console.log('[API] Received risk add POST', body);

        // Support body.radarItemId 
        const { radarItemId } = body;

        if (!initiativeId || !radarItemId) {
            console.error('[API] Missing required fields', { initiativeId, radarItemId });
            return errorResponse('initiativeId and radarItemId are required', 400);
        }

        const result = await TagAnInitiativeWithARiskCommandHandler.handleTagInitiativeWithRisk({ initiativeId, radarItemId });
        console.log('[API] TagAddedEvent emitted', result);

        return successResponse({ ok: true, event: result });
    } catch (error) {
        console.error('[API] Error in risk POST', error);
        return handleApiError(error);
    }
}
