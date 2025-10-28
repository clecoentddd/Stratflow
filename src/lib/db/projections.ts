
import type { Company } from '@/lib/types';
import type { Organization, RadarItem } from '@/lib/types';
import type { CompanyEvent } from '../domain/companies/events';
import type { OrganizationEvent } from '@/lib/domain/organizations/events';
import { _getAllEvents } from './event-store';

// This file is now responsible for BUILDING projections from the event store on demand.
// It no longer holds state itself.

// --- Projection Logic for Organizations ---

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
  // This is the reducer function
  const finalState = events.reduce((org, event) => {
    // This is a hack to preserve dashboard data, which is not event-sourced.
    // In a real system, dashboard changes would also be events.
    const existingDashboard = org?.dashboard;

    switch (event.type) {
      case 'OrganizationCreated':
        const newOrg = {
          id: event.payload.id,
          companyId: event.payload.companyId,
          name: event.payload.name,
          purpose: event.payload.purpose,
          context: event.payload.context,
          level: event.payload.level,
          dashboard: {
            id: `dashboard-${event.payload.id}`,
            name: `${event.payload.name} Strategy Dashboard`,
            strategies: [],
          },
          radar: [],
        };
        // This is a temporary fix to bring back the initial CTO data
        if(newOrg.id === 'org-cto') {
          newOrg.dashboard.strategies = [
             {
              id: 'strat-1',
              description: 'Develop and launch the new \'Innovate\' feature set.',
              timeframe: 'Q4 2024',
              state: 'Open',
              initiatives: [
                {
                  id: 'init-1-1',
                  name: 'Market Research & Analysis',
                  progression: 80,
                  steps: [
                    { key: 'diagnostic', title: 'Diagnostic', iconName: 'Search', items: [{ id: 'item-1', text: 'Analyze competitor pricing' },{ id: 'item-2', text: 'Survey target user base' }],},
                    { key: 'overallApproach', title: 'Overall Approach', iconName: 'Milestone', items: [{ id: 'item-3', text: 'Define phased rollout plan' }],},
                    { key: 'actions', title: 'Actions', iconName: 'ListChecks', items: [] },
                    { key: 'proximateObjectives', title: 'Proximate Objectives', iconName: 'Target', items: [{ id: 'item-4', text: 'Achieve 500 survey responses' }],},
                  ],
                  linkedRadarItemIds: ['radar-item-1'],
                },
              ],
            },
            {
              id: 'strat-2',
              description: 'Marketing and go-to-market strategy.',
              timeframe: 'Q4 2024',
              state: 'Draft',
              initiatives: [],
            },
          ];
        }
        return newOrg;

      case 'OrganizationUpdated':
        if (!org) return null;
        const updatedOrg = {
          ...org,
          name: event.payload.name,
          purpose: event.payload.purpose,
          context: event.payload.context,
        };
        if(existingDashboard) updatedOrg.dashboard = existingDashboard;
        return updatedOrg;

      case 'RadarItemCreated':
        if (!org) return null;
        const orgWithNewItem = {
          ...org,
          radar: [...(org.radar || []), event.payload],
        };
        if(existingDashboard) orgWithNewItem.dashboard = existingDashboard;
        return orgWithNewItem;

      case 'RadarItemUpdated':
        if (!org) return null;
        const orgWithUpdatedItem = {
          ...org,
          radar: (org.radar || []).map(item =>
            item.id === event.payload.id ? { ...item, ...event.payload } : item
          ),
        };
        if(existingDashboard) orgWithUpdatedItem.dashboard = existingDashboard;
        return orgWithUpdatedItem;

      case 'RadarItemDeleted':
        if (!org) return null;
        const orgWithDeletedItem = {
          ...org,
          radar: (org.radar || []).filter(item => item.id !== event.payload.id),
        };
        if(existingDashboard) orgWithDeletedItem.dashboard = existingDashboard;
        return orgWithDeletedItem;

      default:
        return org;
    }
  }, initialState);

  // Another hack to ensure dashboard is preserved if no org-specific events were processed
  if (finalState && !finalState.dashboard && initialState?.dashboard) {
    finalState.dashboard = initialState.dashboard;
  }

  return finalState;
};

// --- Projection Logic for Companies ---
export const applyEventsToCompany = (
  initialState: Company | null,
  events: CompanyEvent[]
): Company | null => {
  return events.reduce((company, event) => {
    switch (event.type) {
      case 'CompanyCreated':
        return {
          id: event.payload.id,
          name: event.payload.name,
        };
      default:
        return company;
    }
  }, initialState);
};

// --- Adaptation Layer for Projections ---

// These functions now build the projections from scratch on every call.
// This is inefficient but guarantees consistency in our mock setup.

/**
 * Retrieves the current projection for all organizations.
 * @returns An array of all organizations.
 */
export const getOrganizationsProjection = async (): Promise<Organization[]> => {
  const allEvents = await _getAllEvents();
  const orgEvents = allEvents.filter(e => e.entity === 'organization') as OrganizationEvent[];
  
  const eventsByAggId: Record<string, OrganizationEvent[]> = {};
  orgEvents.forEach(event => {
    if (!eventsByAggId[event.aggregateId]) {
      eventsByAggId[event.aggregateId] = [];
    }
    eventsByAggId[event.aggregateId].push(event);
  });
  
  const projection: Record<string, Organization> = {};
  for (const aggregateId in eventsByAggId) {
    const aggregateEvents = eventsByAggId[aggregateId];
    // Important: sort events by timestamp to ensure correct order of application
    aggregateEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const org = applyEventsToOrganization(null, aggregateEvents);
    if (org) {
      projection[aggregateId] = org;
    }
  }
  
  return Object.values(projection);
};

/**
 * Retrieves the current projection for a single organization by its ID.
 * @param id - The ID of the organization.
 * @returns The organization object or null if not found.
 */
export const getOrganizationByIdProjection = async (
  id: string
): Promise<Organization | null> => {
    const allOrgs = await getOrganizationsProjection();
    return allOrgs.find(org => org.id === id) || null;
};

/**
 * Retrieves the current projection for all companies.
 * @returns An array of all companies.
 */
export const getCompaniesProjection = async (): Promise<Company[]> => {
    const allEvents = await _getAllEvents();
    const companyEvents = allEvents.filter(e => e.entity === 'company') as CompanyEvent[];
    
    const eventsByAggId: Record<string, CompanyEvent[]> = {};
    companyEvents.forEach(event => {
        if (!eventsByAggId[event.aggregateId]) {
        eventsByAggId[event.aggregateId] = [];
        }
        eventsByAggId[event.aggregateId].push(event);
    });

    const projection: Record<string, Company> = {};
    for (const aggregateId in eventsByAggId) {
        const aggregateEvents = eventsByAggId[aggregateId];
        aggregateEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const company = applyEventsToCompany(null, aggregateEvents);
        if (company) {
            projection[aggregateId] = company;
        }
    }
    return Object.values(projection);
}

// DEPRECATED - No longer needed as we are not storing projections in memory.
export const updateOrganizationProjection = (org: Organization): void => {};
export const updateCompanyProjection = (company: Company): void => {};
export const _setInitialProjections = (
  initialOrgProjections: Record<string, Organization>,
  initialCompanyProjections: Record<string, Company>
) => {};
