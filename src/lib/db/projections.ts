
import type { Company } from '@/lib/types';
import type { Team, RadarItem, Strategy, Initiative, InitiativeItem } from '@/lib/types';
import type { CompanyEvent } from '../domain/companies/events';
import type { TeamEvent } from '@/lib/domain/teams/events';
import { _getAllEvents } from './event-store';

// This file is now responsible for BUILDING projections from the event store on demand.
// It no longer holds state itself.

// --- Projection Logic for Teams ---

/**
 * Applies a series of events to a team's state to build the current projection.
 * @param team - The current state of the team (or null if new).
 * @param events - An array of events to apply.
 * @returns The new state of the team.
 */
export const applyEventsToTeam = (
  initialState: Team | null,
  events: TeamEvent[]
): Team | null => {
  // This is the reducer function
  const finalState = events.reduce((team, event) => {
    if (!team) {
        if (event.type === 'TeamCreated') {
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
        return null; // Cannot process other events if team doesn't exist
    }

    switch (event.type) {
      case 'TeamCreated':
        // This should ideally only happen on the first event.
        return team;

      case 'TeamUpdated':
        return {
          ...team,
          name: event.payload.name,
          purpose: event.payload.purpose,
          context: event.payload.context,
        };

      // --- Radar Events ---
      case 'RadarItemCreated':
        return { ...team, radar: [...(team.radar || []), event.payload] };

      case 'RadarItemUpdated':
        return {
          ...team,
          radar: (team.radar || []).map(item =>
            item.id === event.payload.id ? { ...item, ...event.payload } : item
          ),
        };

      case 'RadarItemDeleted':
        return {
          ...team,
          radar: (team.radar || []).filter(item => item.id !== event.payload.id),
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
            ...team,
            dashboard: {
                ...team.dashboard,
                strategies: [...team.dashboard.strategies, newStrategy]
            }
        };

      case 'StrategyUpdated':
        return {
            ...team,
            dashboard: {
                ...team.dashboard,
                strategies: team.dashboard.strategies.map(s => 
                    s.id === event.payload.strategyId ? { ...s, ...event.payload } : s
                )
            }
        };
      
      // --- Initiative Events ---
      case 'InitiativeCreated':
        return {
            ...team,
            dashboard: {
                ...team.dashboard,
                strategies: team.dashboard.strategies.map(s => {
                    if (s.id !== event.payload.strategyId) return s;
                    const newInitiative: Initiative = {
                      ...event.payload.template,
                      tempId: event.payload.tempId, // Store tempId for lookup
                    };
                    return { ...s, initiatives: [...s.initiatives, newInitiative] };
                })
            }
        };

      case 'InitiativeUpdated':
        return {
            ...team,
            dashboard: {
                ...team.dashboard,
                strategies: team.dashboard.strategies.map(s => ({
                    ...s,
                    initiatives: s.initiatives.map(i =>
                        i.id === event.payload.initiativeId ? { ...i, name: event.payload.name } : i
                    )
                }))
            }
        };
      
      case 'InitiativeDeleted':
        return {
            ...team,
            dashboard: {
                ...team.dashboard,
                strategies: team.dashboard.strategies.map(s => {
                    if (s.id !== event.payload.strategyId) return s;
                    return {
                        ...s,
                        initiatives: s.initiatives.filter(i => i.id !== event.payload.initiativeId)
                    };
                })
            }
        };
      
      case 'InitiativeProgressUpdated':
        return {
            ...team,
            dashboard: {
                ...team.dashboard,
                strategies: team.dashboard.strategies.map(s => ({
                    ...s,
                    initiatives: s.initiatives.map(i => 
                        i.id === event.payload.initiativeId ? { ...i, progression: event.payload.progression } : i
                    )
                }))
            }
        };

      case 'InitiativeRadarItemsLinked':
          return {
              ...team,
              dashboard: {
                  ...team.dashboard,
                  strategies: team.dashboard.strategies.map(s => ({
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
            ...team,
            dashboard: {
                ...team.dashboard,
                strategies: team.dashboard.strategies.map(s => ({
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
            ...team,
            dashboard: {
                ...team.dashboard,
                strategies: team.dashboard.strategies.map(s => ({
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
            ...team,
            dashboard: {
                ...team.dashboard,
                strategies: team.dashboard.strategies.map(s => ({
                    ...s,
                    initiatives: s.initiatives.map(i => {
                         if (i.id !== event.payload.initiativeId) return i;
                         const updatedInitiative = {
                            ...i,
                            steps: i.steps.map(step => ({
                                ...step,
                                items: step.items.filter(item => item.id !== event.payload.itemId)
                            }))
                         };
                         return updatedInitiative;
                    })
                }))
            }
        };


      default:
        return team;
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
 * Retrieves the current projection for all teams.
 * @returns An array of all teams.
 */
export const getTeamsProjection = async (): Promise<Team[]> => {
  const allEvents = await _getAllEvents();
  const teamEvents = allEvents.filter(e => e.entity === 'team') as TeamEvent[];
  
  const eventsByAggId: Record<string, TeamEvent[]> = {};
  teamEvents.forEach(event => {
    if (!eventsByAggId[event.aggregateId]) {
      eventsByAggId[event.aggregateId] = [];
    }
    eventsByAggId[event.aggregateId].push(event);
  });
  
  const projection: Record<string, Team> = {};
  for (const aggregateId in eventsByAggId) {
    const aggregateEvents = eventsByAggId[aggregateId];
    // Important: sort events by timestamp to ensure correct order of application
    aggregateEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const team = applyEventsToTeam(null, aggregateEvents);
    if (team) {
      projection[aggregateId] = team;
    }
  }
  
  return Object.values(projection);
};

/**
 * Retrieves the current projection for a single team by its ID.
 * @param id - The ID of the team.
 * @returns The team object or null if not found.
 */
export const getTeamByIdProjection = async (
  id: string
): Promise<Team | null> => {
    const allTeams = await getTeamsProjection();
    return allTeams.find(team => team.id === id) || null;
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
