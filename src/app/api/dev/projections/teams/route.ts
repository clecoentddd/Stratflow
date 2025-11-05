import { NextResponse } from 'next/server';
import { 
  getTeamsProjection, 
  emptyTeamsProjectionCache, 
  rebuildTeamsProjectionCache 
} from '@/lib/domain/teams/projection';

export async function GET() {
  try {
    console.log('👥 [TEAMS] Getting teams projection...');
    const teams = await getTeamsProjection();
    
    console.log('👥 [TEAMS] Teams retrieved:', teams.length, 'teams');
    return NextResponse.json(teams);
  } catch (error) {
    console.error('❌ [TEAMS] Error getting teams:', error);
    return NextResponse.json({ error: 'Failed to get teams' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    console.log('🗑️ [TEAMS] Emptying teams cache...');
    emptyTeamsProjectionCache();
    console.log('🗑️ [TEAMS] Teams cache emptied successfully');
    return NextResponse.json({ success: true, message: 'Teams cache emptied' });
  } catch (error) {
    console.error('❌ [TEAMS] Error emptying teams cache:', error);
    return NextResponse.json({ error: 'Failed to empty teams cache' }, { status: 500 });
  }
}

export async function POST() {
  try {
    console.log('🔧 [TEAMS] Starting teams rebuild...');
    await rebuildTeamsProjectionCache();
    console.log('🔧 [TEAMS] Teams rebuild completed');
    return NextResponse.json({ 
      success: true, 
      message: 'Teams rebuild completed',
      replayed: 'N/A (query-time projection)'
    });
  } catch (error) {
    console.error('❌ [TEAMS] Error rebuilding teams:', error);
    return NextResponse.json({ error: 'Failed to rebuild teams' }, { status: 500 });
  }
}