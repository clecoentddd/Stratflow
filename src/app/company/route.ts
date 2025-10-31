import { NextResponse, NextRequest } from 'next/server';
import { getCompaniesProjection } from '@/lib/db/projections';

// Minimal API handler for /company — returns the companies projection.
export async function GET(request: NextRequest) {
  try {
    const companies = await getCompaniesProjection();
    return NextResponse.json(companies);
  } catch (error) {
    console.error('Failed to get companies projection (app/company):', error);
    return NextResponse.json([], { status: 200 });
  }
}
