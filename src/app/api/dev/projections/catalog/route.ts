import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('📋 [CATALOG] Getting initiative catalog projection...');
    const { queryEligibleInitiatives } = await import('@/lib/domain/initiatives-catalog/projection');
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
    console.log('🗑️ [CATALOG] Emptying catalog cache...');
    const { resetInitiativeCatalogProjection } = await import('@/lib/domain/initiatives-catalog/projection');
    resetInitiativeCatalogProjection();
    console.log('🗑️ [CATALOG] Catalog cache emptied successfully');
    return NextResponse.json({ success: true, message: 'Catalog cache emptied' });
  } catch (error) {
    console.error('❌ [CATALOG] Error emptying catalog cache:', error);
    return NextResponse.json({ error: 'Failed to empty catalog cache' }, { status: 500 });
  }
}

export async function POST() {
  try {
    console.log('🔧 [CATALOG] Starting catalog rebuild...');
    const { resetInitiativeCatalogProjection } = await import('@/lib/domain/initiatives-catalog/projection');
    
    // Reset and let it rebuild from events via projection handlers
    resetInitiativeCatalogProjection();
    
    console.log('🔧 [CATALOG] Catalog rebuild completed');
    return NextResponse.json({ 
      success: true, 
      message: 'Catalog rebuild completed',
      replayed: 'N/A (event-driven projection)'
    });
  } catch (error) {
    console.error('❌ [CATALOG] Error rebuilding catalog:', error);
    return NextResponse.json({ error: 'Failed to rebuild catalog' }, { status: 500 });
  }
}