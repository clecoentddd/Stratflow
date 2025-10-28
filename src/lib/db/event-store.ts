
import type { CompanyEvent } from '@/lib/domain/companies/events';
import { initialOrganizations } from '@/lib/data';
import type {
  OrganizationEvent,
  OrganizationCreatedEvent,
} from '@/lib/domain/organizations/events';
import type { Organization, Company } from '@/lib/types';
import { applyEventsToOrganization, applyEventsToCompany } from './projections';

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

  // 2. Create Organizations linked to that Company
  const organizationCreatedEvents: OrganizationCreatedEvent[] =
    initialOrganizations.map((org) => ({
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
    }));

  const seedEvents: AllEvents[] = [
    companyCreatedEvent,
    ...organizationCreatedEvents,
  ];

  events.push(...seedEvents);

  // --- This is a bit of a hack for the mock DB to sync projections ---
  // In a real system, this might be a message queue or a DB trigger.
  const initialCompanyProjections: Record<string, Company> = {};
  const initialOrgProjections: Record<string, Organization> = {};

  const companyEvents = seedEvents.filter(e => e.entity === 'company');
  const orgEvents = seedEvents.filter(e => e.entity === 'organization');

  // Project companies first
  companyEvents.forEach((event) => {
    const company = applyEventsToCompany(initialCompanyProjections[event.aggregateId] || null, [event]);
    if (company) {
      initialCompanyProjections[company.id] = company;
    }
  });
  
  // Project organizations
  orgEvents.forEach((event) => {
    const org = applyEventsToOrganization(initialOrgProjections[event.aggregateId] || null, [event]);
    if (org) {
      const initialOrgData = initialOrganizations.find(
        (io) => io.id === org.id
      );
      if (initialOrgData) {
        org.dashboard = initialOrgData.dashboard;
        org.radar = initialOrgData.radar;
      }
      initialOrgProjections[org.id] = org;
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
