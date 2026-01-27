import { successResponse, errorResponse, handleApiError } from '@/lib/api/response';
import { generateNpsEvaluation } from '@/lib/domain/nps-ai-coach/aiClient';

// POST /api/nps-ai-coach/generate
export async function POST(req: Request) {
  try {
    const body = await req.json();
    try { console.debug('[api/nps-ai-coach/generate] received body:', body); } catch (e) { }
    const { purposeText, context, teamId } = body || {};

    if (!purposeText || typeof purposeText !== 'string') {
      return errorResponse('purposeText is required', 400);
    }

    const result = await generateNpsEvaluation(purposeText, context);
    try { console.debug('[api/nps-ai-coach/generate] result:', result); } catch (e) { }

    return successResponse({ ...result, teamId });
  } catch (err) {
    try { console.error('[api/nps-ai-coach/generate] error:', err); } catch (e) { }
    return handleApiError(err);
  }
}
