import { NextRequest } from 'next/server';
import { TagAnInitiativeWithARiskCommandHandler } from '@/lib/domain/tag-an-initiative-with-a-risk/commandHandler';
import { successResponse, handleApiError } from '@/lib/api/response';

export async function DELETE(
    request: NextRequest,
    { params }: { params: { initiativeId: string, radarItemId: string } | Promise<{ initiativeId: string, radarItemId: string }> }
) {
    try {
        const { initiativeId, radarItemId } = (await params) as { initiativeId: string, radarItemId: string };

        console.log('[API] Received risk DELETE', { initiativeId, radarItemId });

        if (!initiativeId || !radarItemId) {
            // Should not happen with Next.js routing but good for safety
            return handleApiError(new Error("Missing ID parameters"));
        }

        const result = await TagAnInitiativeWithARiskCommandHandler.handleRemoveTagFromInitiative({ initiativeId, radarItemId });
        console.log('[API] TagRemovedEvent emitted', result);

        return successResponse({ ok: true, event: result });
    } catch (error) {
        console.error('[API] Error in risk DELETE', error);
        return handleApiError(error);
    }
}
