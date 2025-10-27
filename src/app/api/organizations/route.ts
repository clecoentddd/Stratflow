
import { NextResponse, NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { 
    getOrganizationsProjection,
    updateOrganizationProjection,
    applyEventsToOrganization
} from '@/lib/db/projections';
import { saveEvents } from '@/lib/db/event-store';
import type { 
    CreateOrganizationCommand, 
    OrganizationCreatedEvent,
    Organization
} from '@/lib/types';


// --- Vertical Slice: GET Organizations ---
// This handles fetching the read-model (projection).
export async function GET(request: NextRequest) {
    try {
        const organizations = await getOrganizationsProjection();
        return NextResponse.json(organizations);
    } catch (error) {
        console.error('Failed to get organizations projection:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}


// --- Vertical Slice: Create Organization ---
// This handles the command to create a new organization.
export async function POST(request: NextRequest) {
    try {
        // 1. Parse and Validate the Command
        const command: CreateOrganizationCommand = await request.json();
        if (!command.name || !command.purpose || !command.companyId) {
            return NextResponse.json({ message: 'Company ID, name, and purpose are required' }, { status: 400 });
        }

        // 2. Command Handler Logic
        const newOrgId = `org-${uuidv4()}`;

        // 3. Create Event(s)
        const event: OrganizationCreatedEvent = {
            type: 'OrganizationCreated',
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
        // In a real system, this would be a single transaction.
        await saveEvents([event]);

        // 5. Synchronously Update Projection
        // Re-create the state from its events. For a new org, this is just the creation event.
        const newOrgState = applyEventsToOrganization(null, [event]);

        if (newOrgState) {
            updateOrganizationProjection(newOrgState);
        } else {
             throw new Error("Failed to apply event to create organization state.");
        }

        return NextResponse.json(newOrgState, { status: 201 });

    } catch (error) {
        console.error('Failed to create organization:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
