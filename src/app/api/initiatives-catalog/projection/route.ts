import { NextResponse } from 'next/server';
import { 
  queryEligibleInitiatives, 
  resetInitiativeCatalogProjection 
} from '@/lib/domain/initiatives-catalog/projection';
import { _getAllEvents, runProjectionOn } from '@/lib/db/event-store';

export async function GET() {
  try {
    console.log('📋 [CATALOG] Getting initiative catalog projection...');
    const catalog = await queryEligibleInitiatives({});
    
    console.log('📋 [CATALOG] Catalog retrieved:', catalog.length, 'initiatives');
    return NextResponse.json(catalog);
  } catch (error) {
    console.error('❌ [CATALOG] Error getting catalog:', error);
    return NextResponse.json({ error: 'Failed to get catalog' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    console.log('🗑️ [CATALOG] Emptying catalog projection...');
    resetInitiativeCatalogProjection();
    console.log('🗑️ [CATALOG] Catalog projection emptied successfully');
    return NextResponse.json({ success: true, message: 'Catalog projection emptied' });
  } catch (error) {
    console.error('❌ [CATALOG] Error emptying catalog projection:', error);
    return NextResponse.json({ error: 'Failed to empty catalog projection' }, { status: 500 });
  }
}

export async function POST() {
  try {
    console.log('🔧 [CATALOG] Starting catalog projection rebuild...');
    resetInitiativeCatalogProjection();
    
    const events = await _getAllEvents();
    // Catalog needs team events to build the initiative catalog
    const relevantEvents = events.filter(e => 
      e.entity === 'team' || e.entity === 'initiative' || e.entity === 'strategy'
    );
    
    for (const e of relevantEvents) {
      runProjectionOn(e);
    }
    
    console.log('🔧 [CATALOG] Catalog projection rebuild completed');
    return NextResponse.json({ 
      success: true, 
      message: 'Catalog projection rebuild completed',
      replayed: relevantEvents.length
    });
  } catch (error) {
    console.error('❌ [CATALOG] Error rebuilding catalog projection:', error);
    return NextResponse.json({ error: 'Failed to rebuild catalog projection' }, { status: 500 });
  }
}