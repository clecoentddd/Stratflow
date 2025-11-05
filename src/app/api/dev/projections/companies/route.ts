import { NextResponse } from 'next/server';
import { 
  getCompaniesProjection, 
  emptyCompaniesProjectionCache, 
  rebuildCompaniesProjectionCache 
} from '@/lib/domain/companies/projection';

export async function GET() {
  try {
    console.log('🏢 [COMPANIES] Getting companies projection...');
    const companies = await getCompaniesProjection();
    
    console.log('🏢 [COMPANIES] Companies retrieved:', companies.length, 'companies');
    return NextResponse.json(companies);
  } catch (error) {
    console.error('❌ [COMPANIES] Error getting companies:', error);
    return NextResponse.json({ error: 'Failed to get companies' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    console.log('🗑️ [COMPANIES] Emptying companies cache...');
    emptyCompaniesProjectionCache();
    console.log('🗑️ [COMPANIES] Companies cache emptied successfully');
    return NextResponse.json({ success: true, message: 'Companies cache emptied' });
  } catch (error) {
    console.error('❌ [COMPANIES] Error emptying companies cache:', error);
    return NextResponse.json({ error: 'Failed to empty companies cache' }, { status: 500 });
  }
}

export async function POST() {
  try {
    console.log('🔧 [COMPANIES] Starting companies rebuild...');
    await rebuildCompaniesProjectionCache();
    console.log('🔧 [COMPANIES] Companies rebuild completed');
    return NextResponse.json({ 
      success: true, 
      message: 'Companies rebuild completed',
      replayed: 'N/A (query-time projection)'
    });
  } catch (error) {
    console.error('❌ [COMPANIES] Error rebuilding companies:', error);
    return NextResponse.json({ error: 'Failed to rebuild companies' }, { status: 500 });
  }
}