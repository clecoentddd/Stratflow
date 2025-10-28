
import { NextResponse, NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  getOrganizationByIdProjection,
  updateOrganizationProjection,
  applyEventsToOrganization,
} from '@/lib/db/projections';
import { saveEvents, getEventsFor } from '@/lib/db/event-store';
import type { UpsertRadarItemCommand } from '@/lib/domain/radar/commands';
import type { RadarItemCreatedEvent, RadarItemUpdatedEvent, RadarItemDeletedEvent } from '@/lib/domain/radar/events';

// --- Vertical Slice: GET Radar Items for an Organization ---
export async function GET(request: NextRequest, { params }: { params: { orgId: string } }) {
  try {
    const organization = await getOrganizationByIdProjection(params.orgId);
    if (!organization) {
      return NextResponse.json({ message: 'Organization not found' }, { status: 404 });
    }
    // Return the full organization object, which includes the radar array.
    // The frontend will handle the case where the radar array is empty.
    return NextResponse.json(organization);
  } catch (error) {
    console.error('Failed to get radar items:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}


// --- Vertical Slice: Create Radar Item ---
export async function POST(request: NextRequest, { params }: { params: { orgId: string } }) {
  try {
    const { orgId } = params;
    const command: UpsertRadarItemCommand = await request.json();
    
    // 1. Command Handler Logic (Validation)
    const organization = await getOrganizationByIdProjection(orgId);
    if (!organization) {
      return NextResponse.json({ message: 'Organization not found' }, { status: 404 });
    }
    if (!command.name) {
        return NextResponse.json({ message: 'Radar item name is required' }, { status: 400 });
    }

    // 2. Create Event
    const event: RadarItemCreatedEvent = {
      type: 'RadarItemCreated',
      entity: 'organization',
      aggregateId: orgId,
      timestamp: new Date().toISOString(),
      payload: {
        ...command,
        id: `radar-${uuidv4()}`,
        radarId: orgId,
        created_at: new Date().toISOString(),
      },
    };

    // 3. Save Event(s) to Event Store
    await saveEvents([event]);

    // 4. Synchronously Update Projection
    const updatedOrgState = applyEventsToOrganization(organization, [event]);

    if (updatedOrgState) {
      updateOrganizationProjection(updatedOrgState);
    } else {
      throw new Error('Failed to apply event to create radar item.');
    }

    return NextResponse.json(updatedOrgState, { status: 201 });
  } catch (error) {
    console.error('Failed to create radar item:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// --- Vertical Slice: Update Radar Item ---
export async function PUT(request: NextRequest, { params }: { params: { orgId: string } }) {
    try {
        const { orgId } = params;
        const command: UpsertRadarItemCommand = await request.json();
        
        // 1. Command Handler Logic (Validation)
        const organization = await getOrganizationByIdProjection(orgId);
        if (!organization) {
          return NextResponse.json({ message: 'Organization not found' }, { status: 404 });
        }
        const existingItem = organization.radar.find(item => item.id === command.id);
        if(!existingItem) {
            return NextResponse.json({ message: 'Radar item not found' }, { status: 404 });
        }

        // 2. Create Event
        const event: RadarItemUpdatedEvent = {
            type: 'RadarItemUpdated',
            entity: 'organization',
            aggregateId: orgId,
            timestamp: new Date().toISOString(),
            payload: {
                ...command,
                updated_at: new Date().toISOString(),
            }
        };

        // 3. Save Event(s) to Event Store
        await saveEvents([event]);
        
        // 4. Synchronously Update Projection
        const allEventsForOrg = await getEventsFor(orgId);
        const updatedOrgState = applyEventsToOrganization(null, allEventsForOrg);

        if (updatedOrgState) {
            // Preserve dashboard data as it's not event-sourced yet
            if(organization.dashboard) {
               updatedOrgState.dashboard = organization.dashboard; 
            }
            updateOrganizationProjection(updatedOrgState);
        } else {
            throw new Error('Failed to apply event to update radar item.');
        }

        return NextResponse.json(updatedOrgState, { status: 200 });

    } catch (error) {
        console.error('Failed to update radar item:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}


// --- Vertical Slice: Delete Radar Item ---
export async function DELETE(request: NextRequest, { params }: { params: { orgId: string } }) {
    try {
        const { orgId } = params;
        const { id: itemId } = await request.json();

        if (!itemId) {
             return NextResponse.json({ message: 'Radar item ID is required' }, { status: 400 });
        }

        // 1. Command Handler Logic (Validation)
        const organization = await getOrganizationByIdProjection(orgId);
        if (!organization) {
            return NextResponse.json({ message: 'Organization not found' }, { status: 404 });
        }
        if(!organization.radar.find(item => item.id === itemId)) {
            return NextResponse.json({ message: 'Radar item not found' }, { status: 404 });
        }

        // 2. Create Event
        const event: RadarItemDeletedEvent = {
            type: 'RadarItemDeleted',
            entity: 'organization',
            aggregateId: orgId,
            timestamp: new Date().toISOString(),
            payload: {
                id: itemId,
            }
        };

        // 3. Save Event
        await saveEvents([event]);
        
        // 4. Update Projection
        const updatedOrgState = applyEventsToOrganization(organization, [event]);
        if(updatedOrgState) {
            updateOrganizationProjection(updatedOrgState);
        } else {
             throw new Error('Failed to apply delete event to radar item.');
        }

        return NextResponse.json(updatedOrgState, { status: 200 });

    } catch (error) {
        console.error('Failed to delete radar item:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
