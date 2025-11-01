import { NextResponse, NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { fetchCompanies } from '@/lib/domain/companies/getCompanies';
import { applyEventsToCompany } from '@/lib/db/projections';
import { saveEvents } from '@/lib/db/event-store';
import type { CreateCompanyCommand } from '@/lib/domain/companies/commands';
import type { CompanyCreatedEvent } from '@/lib/domain/companies/events';

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
    // 1. Parse and validate the command
    const command: CreateCompanyCommand = await request.json();
    if (!command.name) {
      return NextResponse.json(
        { message: 'Company name is required' },
        { status: 400 }
      );
    }

    // 2. Command handler logic
    const newCompanyId = `company-${uuidv4()}`;

    // 3. Create event
    const event: CompanyCreatedEvent = {
      type: 'CompanyCreated',
      entity: 'company',
      aggregateId: newCompanyId,
      timestamp: new Date().toISOString(),
      payload: {
        id: newCompanyId,
        name: command.name,
      },
    };

    // 4. Save events to event store
    await saveEvents([event]);

    // 5. Build new state for the response
    const newCompanyState = applyEventsToCompany(null, [event]);

    return NextResponse.json(newCompanyState, { status: 201 });
  } catch (error) {
    console.error('Failed to create company:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
