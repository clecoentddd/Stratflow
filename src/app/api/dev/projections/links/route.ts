import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔗 [LINKS] Getting initiative links projection...');
    const { queryAllActiveLinks } = await import('@/lib/domain/initiatives-linking/projection');
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
    console.log('🗑️ [LINKS] Emptying links cache...');
    // Links projection doesn't seem to have a clear cache - this is a placeholder
    console.log('🗑️ [LINKS] Links cache emptied successfully (no-op)');
    return NextResponse.json({ success: true, message: 'Links cache emptied (no-op)' });
  } catch (error) {
    console.error('❌ [LINKS] Error emptying links cache:', error);
    return NextResponse.json({ error: 'Failed to empty links cache' }, { status: 500 });
  }
}

export async function POST() {
  try {
    console.log('🔧 [LINKS] Starting links rebuild...');
    // Links projection doesn't seem to have a clear rebuild function - this is a placeholder
    console.log('🔧 [LINKS] Links rebuild completed (no-op)');
    return NextResponse.json({ 
      success: true, 
      message: 'Links rebuild completed (no-op)',
      replayed: 'N/A (no clear rebuild mechanism)'
    });
  } catch (error) {
    console.error('❌ [LINKS] Error rebuilding links:', error);
    return NextResponse.json({ error: 'Failed to rebuild links' }, { status: 500 });
  }
}