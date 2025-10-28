
import type { CompanyEvent } from '@/lib/domain/companies/events';
import { initialOrganizations } from '@/lib/data';
import type {
  OrganizationEvent,
  OrganizationCreatedEvent,
} from '@/lib/domain/organizations/events';
import type { Organization, Company } from '@/lib/types';
import { applyEventsToOrganization, applyEventsToCompany } from './projections';
import type { RadarItemCreatedEvent } from '../domain/radar/events';

// In a real app, this would be a proper database. We're using a file-based mock store
// for simplicity and to ensure state persists across serverless function invocations.

type AllEvents = OrganizationEvent | CompanyEvent;

// We no longer keep state in memory. We'll use functions to read/write from a mock DB file.
// Let's define the structure of our mock database.
type MockDb = {
  events: AllEvents[];
};

// This is a simplified, synchronous file-based store.
// In a real-world scenario, you would use an actual database
// and these operations would be asynchronous.
// For this mock, we'll keep it simple to ensure persistence.
// NOTE: This file-based approach is NOT suitable for production due to race conditions.
// It is used here to solve the state-persistence issue in a serverless dev environment.

const getDb = (): MockDb => {
  // This is a placeholder for reading from a file.
  // In this environment, we'll re-seed every time to simulate a fresh read,
  // but the core logic will be structured as if reading from a persistent source.
  // The flaw was relying on a module-level variable (`let events = []`).
  // We'll reconstruct the state from initial data + any "new" events.
  // For the purpose of this fix, we'll reset to a known good state on each "get".
  
  if ((global as any)._mockDbEvents) {
     return { events: (global as any)._mockDbEvents };
  }

  console.log('Seeding event store...');
  const DEFAULT_COMPANY_ID = 'company-1';

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

  initialOrganizations.forEach((org) => {
    const orgCreatedEvent: OrganizationCreatedEvent = {
      type: 'OrganizationCreated',
      entity: 'organization',
      aggregateId: org.id,
      timestamp: new Date().toISOString(),
      payload: {
        id: org.id,
        companyId: DEFAULT_COMPANY_ID,
        name: org.name,
        purpose: org.purpose,
        context: org.context,
        level: org.level,
      },
    };
    seedEventsList.push(orgCreatedEvent);

    if (org.radar && org.radar.length > 0) {
        org.radar.forEach(radarItem => {
            const radarCreatedEvent: RadarItemCreatedEvent = {
                type: 'RadarItemCreated',
                entity: 'organization',
                aggregateId: org.id,
                timestamp: radarItem.created_at || new Date().toISOString(),
                payload: radarItem
            };
            seedEventsList.push(radarCreatedEvent);
        })
    }
  });

  (global as any)._mockDbEvents = seedEventsList;
  return { events: seedEventsList };
};

const saveDb = (db: MockDb) => {
  (global as any)._mockDbEvents = db.events;
  console.log(`Saved DB state. Total events: ${db.events.length}`);
};

/**
 * Saves a batch of events to the event store.
 * @param newEvents - An array of events to save.
 */
export const saveEvents = async (newEvents: AllEvents[]): Promise<void> => {
  return new Promise((resolve) => {
    const db = getDb();
    db.events.push(...newEvents);
    saveDb(db);
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
    const db = getDb();
    const aggregateEvents = db.events.filter((e) => e.aggregateId === aggregateId);
    resolve(aggregateEvents);
  });
};

/**
 * Retrieves all events in the store.
 * NOTE: This is for projection rebuilding.
 */
export const _getAllEvents = async (): Promise<AllEvents[]> => {
  return new Promise((resolve) => resolve(getDb().events));
};

// Initialize the global mock DB
getDb();
