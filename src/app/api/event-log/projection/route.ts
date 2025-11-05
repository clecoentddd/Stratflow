import { NextResponse } from 'next/server';
import { 
  getEventLogProjection, 
  emptyEventLogProjectionCache, 
  rebuildEventLogProjectionCache 
} from '@/lib/domain/event-log';

export async function GET() {
  try {
    console.log('📋 [EVENT-LOG] Getting event log projection...');
    const events = await getEventLogProjection();
    
    console.log('📋 [EVENT-LOG] Events retrieved:', events.length, 'events');
    return NextResponse.json(events);
  } catch (error) {
    console.error('❌ [EVENT-LOG] Error getting events:', error);
    return NextResponse.json({ error: 'Failed to get events' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    console.log('🗑️ [EVENT-LOG] Emptying event log cache...');
    emptyEventLogProjectionCache();
    console.log('🗑️ [EVENT-LOG] Event log cache emptied successfully');
    return NextResponse.json({ success: true, message: 'Event log cache emptied (view only, events preserved)' });
  } catch (error) {
    console.error('❌ [EVENT-LOG] Error emptying event log cache:', error);
    return NextResponse.json({ error: 'Failed to empty event log cache' }, { status: 500 });
  }
}

export async function POST() {
  try {
    console.log('🔧 [EVENT-LOG] Starting event log rebuild...');
    await rebuildEventLogProjectionCache();
    console.log('🔧 [EVENT-LOG] Event log rebuild completed');
    return NextResponse.json({ 
      success: true, 
      message: 'Event log rebuild completed',
      replayed: 'N/A (direct event store view)'
    });
  } catch (error) {
    console.error('❌ [EVENT-LOG] Error rebuilding event log:', error);
    return NextResponse.json({ error: 'Failed to rebuild event log' }, { status: 500 });
  }
}