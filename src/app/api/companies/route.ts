import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { fetchCompanies } from '@/lib/domain/companies/getCompanies';
import { getUsersProjection } from '@/lib/domain/userManagement/user-projection';
import { getTeamsProjection } from '@/lib/domain/teams/projection';
import type { CreateCompanyCommand } from '@/lib/domain/companies/commands';
import { CompaniesCommandHandlers } from '@/lib/domain/companies/commandHandler';
import type { Team } from '@/lib/types';

export const dynamic = 'force-dynamic';

// --- Vertical Slice: GET Companies ---
export async function GET(request: NextRequest) {
  try {
    let companies = await fetchCompanies(); // <— shared helper

    // Filter by user's company
    const users = await getUsersProjection();
    const cookieStore = await cookies();
    const userIdFromCookie = cookieStore.get('userId')?.value;
    let user;
    if (userIdFromCookie) {
      user = users.find(u => u.userId === userIdFromCookie);
    }

    if (!user) {
      // Require login to see companies
      return NextResponse.json([]);
    }

    const isAdmin = user.userId === 'admin@admin.com';

    if (user.companyId && !isAdmin) {
      companies = companies.filter(c => c.id === user.companyId);
    }

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
