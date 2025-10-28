
import { NextResponse, NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  getOrganizationsProjection,
  applyEventsToOrganization,
  getOrganizationByIdProjection,
} from '@/lib/db/projections';
import { saveEvents, getEventsFor } from '@/lib/db/event-store';
import type { CreateOrganizationCommand, UpdateOrganizationCommand } from '@/lib/domain/organizations/commands';
import type { OrganizationCreatedEvent, OrganizationUpdatedEvent, OrganizationEvent } from '@/lib/domain/organizations/events';

// --- Vertical Slice: GET Organizations ---
export async function GET(request: NextRequest) {
  try {
    const organizations = await getOrganizationsProjection();
    return NextResponse.json(organizations);
  } catch (error) {
    console.error('Failed to get organizations projection:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// --- Vertical Slice: Create Organization ---
export async function POST(request: NextRequest) {
  try {
    // 1. Parse and Validate the Command
    const command: CreateOrganizationCommand = await request.json();
    if (!command.name || !command.purpose || !command.companyId) {
      return NextResponse.json(
        { message: 'Company ID, name, and purpose are required' },
        { status: 400 }
      );
    }

    // 2. Command Handler Logic
    const newOrgId = `org-${uuidv4()}`;

    // 3. Create Event(s)
    const event: OrganizationCreatedEvent = {
      type: 'OrganizationCreated',
      entity: 'organization',
      aggregateId: newOrgId,
      timestamp: new Date().toISOString(),
      payload: {
        id: newOrgId,
        companyId: command.companyId,
        name: command.name,
        purpose: command.purpose,
        context: command.context,
        level: command.level,
      },
    };

    // 4. Save Event(s) to Event Store
    await saveEvents([event]);

    // 5. Re-project from events to get the created state for the response
    const newOrgState = applyEventsToOrganization(null, [event]);

    if (!newOrgState) {
      throw new Error('Failed to apply event to create organization state.');
    }

    return NextResponse.json(newOrgState, { status: 201 });
  } catch (error) {
    console.error('Failed to create organization:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// --- Vertical Slice: Update Organization ---
export async function PUT(request: NextRequest) {
    try {
        // 1. Parse and Validate Command
        const command: UpdateOrganizationCommand = await request.json();
        if (!command.id || !command.name || !command.purpose) {
            return NextResponse.json({ message: 'ID, name, and purpose are required' }, { status: 400 });
        }

        // 2. Command Handler Logic
        const { id, name, purpose, context } = command;

        const existingOrg = await getOrganizationByIdProjection(id);
        if (!existingOrg) {
            return NextResponse.json({ message: 'Organization not found' }, { status: 404 });
        }

        // 3. Create Event
        const event: OrganizationUpdatedEvent = {
            type: 'OrganizationUpdated',
            entity: 'organization',
            aggregateId: id,
            timestamp: new Date().toISOString(),
            payload: {
                name,
                purpose,
                context,
            },
        };

        // 4. Save Event to Event Store
        await saveEvents([event]);

        // 5. Re-project all events for the aggregate to rebuild its state accurately for the response
        const allEventsForOrg = await getEventsFor(id);
        const updatedOrgState = applyEventsToOrganization(null, allEventsForOrg);
        
        if (!updatedOrgState) {
            throw new Error('Failed to apply events to update organization state.');
        }

        return NextResponse.json(updatedOrgState, { status: 200 });

    } catch (error) {
        console.error('Failed to update organization:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
