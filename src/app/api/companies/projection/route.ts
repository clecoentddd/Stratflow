import { successResponse, handleApiError } from '@/lib/api/response';
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
    return successResponse(companies);
  } catch (error) {
    console.error('❌ [COMPANIES] Error getting companies:', error);
    return handleApiError(error);
  }
}

export async function DELETE() {
  try {
    console.log('🗑️ [COMPANIES] Emptying companies cache...');
    emptyCompaniesProjectionCache();
    console.log('🗑️ [COMPANIES] Companies cache emptied successfully');
    return successResponse({ success: true, message: 'Companies cache emptied' });
  } catch (error) {
    console.error('❌ [COMPANIES] Error emptying companies cache:', error);
    return handleApiError(error);
  }
}

export async function POST() {
  try {
    console.log('🔧 [COMPANIES] Starting companies rebuild...');
    await rebuildCompaniesProjectionCache();
    console.log('🔧 [COMPANIES] Companies rebuild completed');
    return successResponse({
      success: true,
      message: 'Companies rebuild completed',
      replayed: 'N/A (live projection)'
    });
  } catch (error) {
    console.error('❌ [COMPANIES] Error rebuilding companies:', error);
    return handleApiError(error);
  }
}