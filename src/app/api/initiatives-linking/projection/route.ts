import { NextResponse } from 'next/server';
import { 
  queryAllActiveLinks, 
  resetInitiativeLinksProjection 
} from '@/lib/domain/initiatives-linking/projection';
import { _getAllEvents, runProjectionOn } from '@/lib/db/event-store';

export async function GET() {
  try {
    console.log('🔗 [LINKS] Getting initiative links projection...');
    const links = await queryAllActiveLinks();
    
    console.log('🔗 [LINKS] Links retrieved:', links.length, 'links');
    return NextResponse.json(links);
  } catch (error) {
    console.error('❌ [LINKS] Error getting links:', error);
    return NextResponse.json({ error: 'Failed to get links' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    console.log('🗑️ [LINKS] Emptying links projection...');
    resetInitiativeLinksProjection();
    console.log('🗑️ [LINKS] Links projection emptied successfully');
    return NextResponse.json({ success: true, message: 'Links projection emptied' });
  } catch (error) {
    console.error('❌ [LINKS] Error emptying links projection:', error);
    return NextResponse.json({ error: 'Failed to empty links projection' }, { status: 500 });
  }
}

export async function POST() {
  try {
    console.log('🔧 [LINKS] Starting links projection rebuild...');
    resetInitiativeLinksProjection();
    
    const events = await _getAllEvents();
    const linkEvents = events.filter(e => 
      e.type === 'InitiativeLinked' || e.type === 'InitiativeUnlinked'
    );
    
    for (const e of linkEvents) {
      runProjectionOn(e);
    }
    
    console.log('🔧 [LINKS] Links projection rebuild completed');
    return NextResponse.json({ 
      success: true, 
      message: 'Links projection rebuild completed',
      replayed: linkEvents.length
    });
  } catch (error) {
    console.error('❌ [LINKS] Error rebuilding links projection:', error);
    return NextResponse.json({ error: 'Failed to rebuild links projection' }, { status: 500 });
  }
}