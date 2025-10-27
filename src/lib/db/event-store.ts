
import { initialOrganizations } from '@/lib/data';
import type { OrganizationEvent, OrganizationCreatedEvent } from '@/lib/domain/organizations/events';
import type { Organization } from '@/lib/types';
import { applyEventsToOrganization } from './projections';

// --- Mock Event Store (In-Memory) ---
// In a real app, this would be a database like Supabase, DynamoDB, or a dedicated event store.

let events: OrganizationEvent[] = [];

// Define a default company for seeding purposes
const DEFAULT_COMPANY_ID = "company-1";

// Seed the event store with initial data
const seedEvents = () => {
    if (events.length > 0) return; // Don't re-seed

    console.log("Seeding event store...");
    const seedEvents: OrganizationCreatedEvent[] = initialOrganizations.map(org => ({
        type: 'OrganizationCreated',
        aggregateId: org.id,
        timestamp: new Date().toISOString(),
        payload: {
            id: org.id,
            companyId: DEFAULT_COMPANY_ID, // Associate with the default company
            name: org.name,
            purpose: org.purpose,
            context: org.context,
            level: org.level,
        },
    }));
    events.push(...seedEvents);

    // Also need to apply these seed events to the projection
    const initialProjection = seedEvents.reduce((acc, event) => {
        // The state of an organization is built by replaying events.
        // For a new org, the initial state is null.
        const org = applyEventsToOrganization(null, [event]);
        if(org) {
            // We also need to transfer the dashboard and radar data from the initial static data
            const initialOrgData = initialOrganizations.find(io => io.id === org.id);
            if (initialOrgData) {
                org.dashboard = initialOrgData.dashboard;
                org.radar = initialOrgData.radar;
            }
            acc[org.id] = org;
        }
        return acc;
    }, {} as Record<string, Organization>);

    // This is a bit of a hack for the mock DB to sync projection and event store
    const { _setInitialProjections } = require('./projections');
    _setInitialProjections(initialProjection);
};

// --- Adaptation Layer ---
// These functions provide a clean interface for the rest of the app.
// If you swap the backend, you only need to change the implementation inside these functions.

/**
 * Saves a batch of events to the event store.
 * @param newEvents - An array of events to save.
 */
export const saveEvents = async (newEvents: OrganizationEvent[]): Promise<void> => {
    // In a real DB, this would be a transactional write.
    return new Promise(resolve => {
        events.push(...newEvents);
        console.log(`Saved ${newEvents.length} events. Total events: ${events.length}`);
        resolve();
    });
};

/**
 * Retrieves all events for a specific aggregate ID (e.g., an organization ID).
 * @param aggregateId - The ID of the aggregate.
 * @returns An array of events.
 */
export const getEventsFor = async (aggregateId: string): Promise<OrganizationEvent[]> => {
    return new Promise(resolve => {
        const aggregateEvents = events.filter(e => e.aggregateId === aggregateId);
        resolve(aggregateEvents);
    });
};

/**
 * Retrieves all events in the store.
 * NOTE: This is for projection rebuilding and would be handled differently in a real system.
 */
export const _getAllEvents = async (): Promise<OrganizationEvent[]> => {
    return new Promise(resolve => resolve(events));
};


// Initialize seed data
seedEvents();
