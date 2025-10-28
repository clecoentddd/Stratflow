
import type { CompanyEvent } from '@/lib/domain/companies/events';
import { initialOrganizations } from '@/lib/data';
import type {
  OrganizationEvent,
  OrganizationCreatedEvent,
} from '@/lib/domain/organizations/events';
import type { Organization, Company } from '@/lib/types';
import { applyEventsToOrganization, applyEventsToCompany } from './projections';
import type { RadarItemCreatedEvent } from '../domain/radar/events';

// --- Mock Event Store (In-Memory) ---
// In a real app, this would be a database like Supabase, DynamoDB, or a dedicated event store.

type AllEvents = OrganizationEvent | CompanyEvent;
let events: AllEvents[] = [];

// Seed the event store with initial data
const seedEvents = () => {
  if (events.length > 0) return; // Don't re-seed

  console.log('Seeding event store...');
  const DEFAULT_COMPANY_ID = 'company-1';

  // 1. Create the Company first
  const companyCreatedEvent: CompanyEvent = {
    type: 'CompanyCreated',
    entity: 'company',
    aggregateId: DEFAULT_COMPANY_ID,
    timestamp: new Date().toISOString(),
    payload: {
      id: DEFAULT_COMPANY_ID,
      name: 'Default Company',
    },
  };
  
  let seedEventsList: AllEvents[] = [companyCreatedEvent];

  // 2. Create Organizations linked to that Company
  initialOrganizations.forEach((org) => {
    const orgCreatedEvent: OrganizationCreatedEvent = {
      type: 'OrganizationCreated',
      entity: 'organization',
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
    };
    seedEventsList.push(orgCreatedEvent);

    // 3. Create Radar Items for the organization
    if (org.radar && org.radar.length > 0) {
        org.radar.forEach(radarItem => {
            const radarCreatedEvent: RadarItemCreatedEvent = {
                type: 'RadarItemCreated',
                entity: 'organization', // Radar items are part of the Organization aggregate
                aggregateId: org.id,
                timestamp: radarItem.created_at || new Date().toISOString(),
                payload: radarItem
            };
            seedEventsList.push(radarCreatedEvent);
        })
    }
  });


  events.push(...seedEventsList);

  // --- This is a bit of a hack for the mock DB to sync projections ---
  // In a real system, this might be a message queue or a DB trigger.
  const initialCompanyProjections: Record<string, Company> = {};
  const initialOrgProjections: Record<string, Organization> = {};

  const companyEvents = seedEventsList.filter(e => e.entity === 'company');
  const orgEvents = seedEventsList.filter(e => e.entity === 'organization');

  // Project companies first
  companyEvents.forEach((event) => {
    const company = applyEventsToCompany(initialCompanyProjections[event.aggregateId] || null, [event as CompanyEvent]);
    if (company) {
      initialCompanyProjections[company.id] = company;
    }
  });
  
  // Group org events by aggregateId
  const orgEventsByAggId: Record<string, OrganizationEvent[]> = {};
  orgEvents.forEach(event => {
    if (!orgEventsByAggId[event.aggregateId]) {
      orgEventsByAggId[event.aggregateId] = [];
    }
    orgEventsByAggId[event.aggregateId].push(event as OrganizationEvent);
  });
  
  // Project organizations
  Object.keys(orgEventsByAggId).forEach(orgId => {
    const org = applyEventsToOrganization(null, orgEventsByAggId[orgId]);
    if(org) {
        // Find dashboard from initial data as it's not event sourced yet
        const initialOrgData = initialOrganizations.find(io => io.id === org.id);
        if (initialOrgData) {
            org.dashboard = initialOrgData.dashboard;
        }
        initialOrgProjections[orgId] = org;
    }
  });


  const { _setInitialProjections } = require('./projections');
  _setInitialProjections(initialOrgProjections, initialCompanyProjections);
};

// --- Adaptation Layer ---
// These functions provide a clean interface for the rest of the app.
// If you swap the backend, you only need to change the implementation inside these functions.

/**
 * Saves a batch of events to the event store.
 * @param newEvents - An array of events to save.
 */
export const saveEvents = async (newEvents: AllEvents[]): Promise<void> => {
  // In a real DB, this would be a transactional write.
  return new Promise((resolve) => {
    events.push(...newEvents);
    console.log(
      `Saved ${newEvents.length} events. Total events: ${events.length}`
    );
    resolve();
  });
};

/**
 * Retrieves all events for a specific aggregate ID (e.g., an organization ID).
 * @param aggregateId - The ID of the aggregate.
 * @returns An array of events.
 */
export const getEventsFor = async (
  aggregateId: string
): Promise<AllEvents[]> => {
  return new Promise((resolve) => {
    const aggregateEvents = events.filter((e) => e.aggregateId === aggregateId);
    resolve(aggregateEvents);
  });
};

/**
 * Retrieves all events in the store.
 * NOTE: This is for projection rebuilding and would be handled differently in a real system.
 */
export const _getAllEvents = async (): Promise<AllEvents[]> => {
  return new Promise((resolve) => resolve(events));
};

// Initialize seed data
seedEvents();
