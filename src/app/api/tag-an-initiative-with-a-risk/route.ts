import { NextRequest, NextResponse } from 'next/server';
import { TagAnInitiativeWithARiskCommandHandler } from '@/lib/domain/tag-an-initiative-with-a-risk/commandHandler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[API] Received tag-an-initiative-with-a-risk POST', body);
    const { initiativeId, radarItemId, action } = body;
    if (!initiativeId || !radarItemId || !action) {
      console.error('[API] Missing required fields', { initiativeId, radarItemId, action });
      return NextResponse.json({ message: 'initiativeId, radarItemId, and action are required' }, { status: 400 });
    }
    let result;
    if (action === 'add') {
      result = await TagAnInitiativeWithARiskCommandHandler.handleTagInitiativeWithRisk({ initiativeId, radarItemId });
      console.log('[API] TagAddedEvent emitted', result);
    } else if (action === 'remove') {
      result = await TagAnInitiativeWithARiskCommandHandler.handleRemoveTagFromInitiative({ initiativeId, radarItemId });
      console.log('[API] TagRemovedEvent emitted', result);
    } else {
      console.error('[API] Invalid action', action);
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }
    return NextResponse.json({ ok: true, event: result });
  } catch (error) {
    console.error('[API] Error in tag-an-initiative-with-a-risk POST', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
