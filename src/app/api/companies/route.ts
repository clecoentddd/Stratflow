import { NextResponse, NextRequest } from 'next/server';
import { fetchCompanies } from '@/lib/domain/companies/getCompanies';
import type { CreateCompanyCommand } from '@/lib/domain/companies/commands';
import { CompaniesCommandHandlers } from '@/lib/domain/companies/commandHandler';

// --- Vertical Slice: GET Companies ---
export async function GET(request: NextRequest) {
  try {
    const companies = await fetchCompanies(); // <— shared helper
    return NextResponse.json(companies);
  } catch (error) {
    console.error('Failed to get companies projection:', error);
    // Return empty array if projection is not ready
    return NextResponse.json([]);
  }
}

// --- Vertical Slice: Create Company ---
export async function POST(request: NextRequest) {
  try {
    const command: CreateCompanyCommand = await request.json();
    
    const created = await CompaniesCommandHandlers.handleCreateCompany(command);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Failed to create company:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    const status = message.includes('Company name is required') ? 400 : 500;
    return NextResponse.json({ message }, { status });
  }
}
