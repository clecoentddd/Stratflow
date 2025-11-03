import { NextResponse } from 'next/server';
import { generateNpsEvaluation } from '../../../../lib/domain/nps-ai-coach/aiClient';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Log incoming request body for debugging
    try { console.debug('[api/nps-ai-coach/generate] received body:', body); } catch (e) {}
    const { purposeText, context, teamId } = body || {};

    if (!purposeText || typeof purposeText !== 'string') {
      return NextResponse.json({ error: 'purposeText is required' }, { status: 400 });
    }

    const result = await generateNpsEvaluation(purposeText, context);
    try { console.debug('[api/nps-ai-coach/generate] result:', result); } catch (e) {}

    return NextResponse.json({ ...result, teamId });
  } catch (err) {
    try { console.error('[api/nps-ai-coach/generate] error:', err); } catch (e) {}
    return NextResponse.json({ error: (err as Error).message ?? String(err) }, { status: 500 });
  }
}
