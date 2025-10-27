
import { NextResponse, NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  getCompaniesProjection,
  updateCompanyProjection,
  applyEventsToCompany,
} from '@/lib/db/projections';
import { saveEvents } from '@/lib/db/event-store';
import type { CreateCompanyCommand } from '@/lib/domain/companies/commands';
import type { CompanyCreatedEvent } from '@/lib/domain/companies/events';

// --- Vertical Slice: GET Companies ---
export async function GET(request: NextRequest) {
  try {
    const companies = await getCompaniesProjection();
    return NextResponse.json(companies);
  } catch (error) {
    console.error('Failed to get companies projection:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// --- Vertical Slice: Create Company ---
export async function POST(request: NextRequest) {
  try {
    // 1. Parse and Validate the Command
    const command: CreateCompanyCommand = await request.json();
    if (!command.name) {
      return NextResponse.json(
        { message: 'Company name is required' },
        { status: 400 }
      );
    }

    // 2. Command Handler Logic
    const newCompanyId = `company-${uuidv4()}`;

    // 3. Create Event(s)
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

    // 4. Save Event(s) to Event Store
    await saveEvents([event]);

    // 5. Synchronously Update Projection
    const newCompanyState = applyEventsToCompany(null, [event]);

    if (newCompanyState) {
      updateCompanyProjection(newCompanyState);
    } else {
      throw new Error('Failed to apply event to create company state.');
    }

    return NextResponse.json(newCompanyState, { status: 201 });
  } catch (error) {
    console.error('Failed to create company:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
