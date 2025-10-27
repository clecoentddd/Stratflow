
import type { Organization, OrganizationEvent, OrganizationCreatedEvent } from '@/lib/types';

// --- Mock Projection Store (In-Memory) ---
// This acts as our read-optimized database. It's updated whenever events are saved.
let organizationProjection: Record<string, Organization> = {};


// --- Projection Logic ---

/**
 * Applies a series of events to an organization's state to build the current projection.
 * @param org - The current state of the organization (or null if new).
 * @param events - An array of events to apply.
 * @returns The new state of the organization.
 */
export const applyEventsToOrganization = (
    initialState: Organization | null,
    events: OrganizationEvent[]
): Organization | null => {
    return events.reduce((org, event) => {
        switch (event.type) {
            case 'OrganizationCreated':
                // For a created event, we ignore the initial state and create a new one.
                return {
                    id: event.payload.id,
                    companyId: event.payload.companyId,
                    name: event.payload.name,
                    purpose: event.payload.purpose,
                    context: event.payload.context,
                    level: event.payload.level,
                    // Initialize empty dashboard and radar
                    dashboard: {
                        id: `dashboard-${event.payload.id}`,
                        name: `${event.payload.name} Strategy Dashboard`,
                        strategies: [],
                    },
                    radar: [],
                };
            // Add other event types here (e.g., 'OrganizationUpdated')
            // case 'OrganizationUpdated':
            //     if (!org) return null; // Cannot update a non-existent org
            //     return { ...org, ...event.payload };
            default:
                return org;
        }
    }, initialState);
};


// --- Adaptation Layer for Projections ---

/**
 * Updates the projection for a single organization.
 * This is called synchronously after events are saved.
 * @param org - The updated organization object.
 */
export const updateOrganizationProjection = (org: Organization): void => {
    console.log(`Updating projection for organization: ${org.id}`);
    organizationProjection[org.id] = org;
};

/**
 * Retrieves the current projection for all organizations.
 * @returns An array of all organizations.
 */
export const getOrganizationsProjection = async (): Promise<Organization[]> => {
    return new Promise(resolve => {
        resolve(Object.values(organizationProjection));
    });
};

/**
 * Retrieves the current projection for a single organization by its ID.
 * @param id - The ID of the organization.
 * @returns The organization object or null if not found.
 */
export const getOrganizationByIdProjection = async (id: string): Promise<Organization | null> => {
     return new Promise(resolve => {
        resolve(organizationProjection[id] || null);
    });
}

/**
 * INTERNAL USE ONLY: Used by the mock event store to seed the initial projection.
 * In a real system, you would have a dedicated process to build projections from the event store on startup.
 */
export const _setInitialProjections = (initialProjections: Record<string, Organization>) => {
    organizationProjection = initialProjections;
    console.log("Initial projections have been set.");
}
