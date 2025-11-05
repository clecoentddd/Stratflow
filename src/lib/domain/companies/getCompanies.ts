import { getCompaniesProjection } from './projection';
import type { Company } from '@/lib/types';

export async function fetchCompanies(): Promise<Company[]> {
  return await getCompaniesProjection();
}