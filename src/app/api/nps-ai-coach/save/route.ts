import { NextResponse } from 'next/server';
import { saveNpsSuggestion } from '../../../../lib/domain/nps-ai-coach/persistence';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    try { console.debug('[api/nps-ai-coach/save] received body:', body); } catch (e) {}
    const { teamId, suggestion, metadata } = body || {};
    if (!suggestion || typeof suggestion !== 'string') {
      return NextResponse.json({ error: 'suggestion is required' }, { status: 400 });
    }

    const saved = await saveNpsSuggestion(teamId, suggestion, metadata);
    try { console.debug('[api/nps-ai-coach/save] saved:', saved); } catch (e) {}
    return NextResponse.json(saved);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
