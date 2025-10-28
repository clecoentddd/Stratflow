
import type { Company } from '@/lib/types';
import type { Organization, RadarItem, Strategy, Initiative, InitiativeItem } from '@/lib/types';
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
    if (!org) {
        if (event.type === 'OrganizationCreated') {
             return {
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
        }
        return null; // Cannot process other events if org doesn't exist
    }

    switch (event.type) {
      case 'OrganizationCreated':
        // This should ideally only happen on the first event.
        return org;

      case 'OrganizationUpdated':
        return {
          ...org,
          name: event.payload.name,
          purpose: event.payload.purpose,
          context: event.payload.context,
        };

      // --- Radar Events ---
      case 'RadarItemCreated':
        return { ...org, radar: [...(org.radar || []), event.payload] };

      case 'RadarItemUpdated':
        return {
          ...org,
          radar: (org.radar || []).map(item =>
            item.id === event.payload.id ? { ...item, ...event.payload } : item
          ),
        };

      case 'RadarItemDeleted':
        return {
          ...org,
          radar: (org.radar || []).filter(item => item.id !== event.payload.id),
        };

      // --- Strategy Events ---
      case 'StrategyCreated':
        const newStrategy: Strategy = {
            id: event.payload.strategyId,
            description: event.payload.description,
            timeframe: event.payload.timeframe,
            state: "Draft",
            initiatives: [],
        };
        return {
            ...org,
            dashboard: {
                ...org.dashboard,
                strategies: [...org.dashboard.strategies, newStrategy]
            }
        };

      case 'StrategyStateUpdated':
        return {
            ...org,
            dashboard: {
                ...org.dashboard,
                strategies: org.dashboard.strategies.map(s => 
                    s.id === event.payload.strategyId ? { ...s, state: event.payload.state } : s
                )
            }
        };
      
      // --- Initiative Events ---
      case 'InitiativeCreated':
        return {
            ...org,
            dashboard: {
                ...org.dashboard,
                strategies: org.dashboard.strategies.map(s => {
                    if (s.id !== event.payload.strategyId) return s;
                    const newInitiative: Initiative = event.payload.template;
                    return { ...s, initiatives: [...s.initiatives, newInitiative] };
                })
            }
        };
      
      case 'InitiativeProgressUpdated':
        return {
            ...org,
            dashboard: {
                ...org.dashboard,
                strategies: org.dashboard.strategies.map(s => ({
                    ...s,
                    initiatives: s.initiatives.map(i => 
                        i.id === event.payload.initiativeId ? { ...i, progression: event.payload.progression } : i
                    )
                }))
            }
        };

      case 'InitiativeRadarItemsLinked':
          return {
              ...org,
              dashboard: {
                  ...org.dashboard,
                  strategies: org.dashboard.strategies.map(s => ({
                      ...s,
                      initiatives: s.initiatives.map(i => 
                          i.id === event.payload.initiativeId ? { ...i, linkedRadarItemIds: event.payload.linkedRadarItemIds } : i
                      )
                  }))
              }
          };

      // --- Initiative Item Events ---
      case 'InitiativeItemAdded':
        return {
            ...org,
            dashboard: {
                ...org.dashboard,
                strategies: org.dashboard.strategies.map(s => ({
                    ...s,
                    initiatives: s.initiatives.map(i => {
                        if (i.id !== event.payload.initiativeId) return i;
                        return {
                            ...i,
                            steps: i.steps.map(step => 
                                step.key === event.payload.stepKey 
                                    ? { ...step, items: [...step.items, event.payload.item] } 
                                    : step
                            )
                        };
                    })
                }))
            }
        };

      case 'InitiativeItemUpdated':
         return {
            ...org,
            dashboard: {
                ...org.dashboard,
                strategies: org.dashboard.strategies.map(s => ({
                    ...s,
                    initiatives: s.initiatives.map(i => ({
                        ...i,
                        steps: i.steps.map(step => ({
                            ...step,
                            items: step.items.map(item => 
                                item.id === event.payload.itemId ? { ...item, text: event.payload.text } : item
                            )
                        }))
                    }))
                }))
            }
        };

      case 'InitiativeItemDeleted':
          return {
            ...org,
            dashboard: {
                ...org.dashboard,
                strategies: org.dashboard.strategies.map(s => ({
                    ...s,
                    initiatives: s.initiatives.map(i => {
                         if (i.id !== event.payload.initiativeId) return i;
                         return {
                            ...i,
                            steps: i.steps.map(step => ({
                                ...step,
                                items: step.items.filter(item => item.id !== event.payload.itemId)
                            }))
                         }
                    })
                }))
            }
        };


      default:
        return org;
    }
  }, initialState);

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
