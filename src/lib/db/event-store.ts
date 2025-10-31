import type { CompanyEvent } from '@/lib/domain/companies/events';
import { initialTeams, initialLinks } from '@/lib/data';
import type {
  TeamEvent,
  TeamCreatedEvent,
} from '@/lib/domain/teams/events';
import type { Team, Company, InitiativeStep } from '@/lib/types';
import { applyEventsToTeam, applyEventsToCompany } from './projections';
import type { RadarItemCreatedEvent } from '../domain/radar/events';
import type { StrategyCreatedEvent, StrategyUpdatedEvent } from '@/lib/domain/strategies/events';
import type { InitiativeCreatedEvent } from '@/lib/domain/initiatives/events';
import type { LinkingEvents, InitiativeLinkedEvent } from '@/lib/domain/initiatives/linking/events';

// In a real app, this would be a proper database. We're using a file-based mock store
// for simplicity and to ensure state persists across serverless function invocations.

type AllEvents = TeamEvent | CompanyEvent | LinkingEvents;

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
  const DEMO_COMPANY_ID = 'company-demo';

  const companyCreatedEvent: CompanyEvent = {
    type: 'CompanyCreated',
    entity: 'company',
    aggregateId: DEMO_COMPANY_ID,
    timestamp: new Date().toISOString(),
    payload: {
      id: DEMO_COMPANY_ID,
      name: 'Demo Company',
    },
  };
  
  let seedEventsList: AllEvents[] = [companyCreatedEvent];

  initialTeams.forEach((team) => {
    const orgCreatedEvent: TeamCreatedEvent = {
      type: 'TeamCreated',
      entity: 'team',
      aggregateId: team.id,
      timestamp: new Date().toISOString(),
      payload: {
        id: team.id,
        companyId: DEMO_COMPANY_ID,
        name: team.name,
        purpose: team.purpose,
        context: team.context,
        level: team.level,
      },
    };
    seedEventsList.push(orgCreatedEvent);

    if (team.radar && team.radar.length > 0) {
        team.radar.forEach(radarItem => {
            const radarCreatedEvent: RadarItemCreatedEvent = {
                type: 'RadarItemCreated',
                entity: 'team',
                aggregateId: team.id,
                timestamp: radarItem.created_at || new Date().toISOString(),
                payload: radarItem
            };
            seedEventsList.push(radarCreatedEvent);
        })
    }

    // Seed strategies
    if (team.dashboard?.strategies && team.dashboard.strategies.length > 0) {
      team.dashboard.strategies.forEach((s) => {
        const stratCreated: StrategyCreatedEvent = {
          type: 'StrategyCreated',
          entity: 'team',
          aggregateId: team.id,
          timestamp: new Date().toISOString(),
          payload: {
            strategyId: s.id,
            description: s.description,
            timeframe: s.timeframe,
          },
        };
        seedEventsList.push(stratCreated);

        // If the seed strategy has a non-default state, emit an update to set it explicitly.
        if (s.state && s.state !== 'Draft') {
          const stratStateSet: StrategyUpdatedEvent = {
            type: 'StrategyUpdated',
            entity: 'team',
            aggregateId: team.id,
            timestamp: new Date(new Date().getTime() + 1).toISOString(), // ensure it applies after creation
            payload: {
              strategyId: s.id,
              state: s.state,
            },
          };
          seedEventsList.push(stratStateSet);
        }

        // Seed initiatives under this strategy
        if (s.initiatives && s.initiatives.length > 0) {
          s.initiatives.forEach((init) => {
            const defaultSteps: InitiativeStep[] = [
              { key: 'diagnostic', title: 'Diagnostic', iconName: 'Search', items: [] },
              { key: 'overallApproach', title: 'Overall Approach', iconName: 'Milestone', items: [] },
              { key: 'actions', title: 'Actions', iconName: 'ListChecks', items: [] },
              { key: 'proximateObjectives', title: 'Proximate Objectives', iconName: 'Target', items: [] },
            ];
            const seededSteps = Array.isArray(init.steps) && init.steps.length > 0 ? init.steps : defaultSteps;
            const initCreated: InitiativeCreatedEvent = {
              type: 'InitiativeCreated',
              entity: 'team',
              aggregateId: team.id,
              timestamp: new Date().toISOString(),
              payload: {
                strategyId: s.id,
                initiativeId: init.id,
                tempId: init.id, // seed linkage; not used post-creation
                name: init.name,
                template: {
                  id: init.id,
                  name: init.name,
                  progression: init.progression ?? 0,
                  steps: seededSteps,
                  linkedRadarItemIds: init.linkedRadarItemIds || [],
                },
              },
            };
            seedEventsList.push(initCreated);
          });
        }
      });
    }
  });

  // Seed initiative links based on initialLinks
  if (initialLinks && initialLinks.length) {
    // Build a lookup from initiativeId -> { teamId, teamLevel, strategyId }
    const initContext = new Map<string, { teamId: string; teamLevel: number; strategyId: string }>();
    initialTeams.forEach(t => {
      t.dashboard?.strategies?.forEach(s => {
        s.initiatives?.forEach(i => {
          initContext.set(i.id, { teamId: t.id, teamLevel: t.level, strategyId: s.id });
        })
      })
    });

    initialLinks.forEach(link => {
      const from = initContext.get(link.from);
      const to = initContext.get(link.to);
      if (!from || !to) return;
      const e: InitiativeLinkedEvent = {
        type: 'InitiativeLinked',
        entity: 'team',
        aggregateId: from.teamId,
        timestamp: new Date().toISOString(),
        payload: {
          fromInitiativeId: link.from,
          toInitiativeId: link.to,
          fromStrategyId: from.strategyId,
          toStrategyId: to.strategyId,
          fromTeamId: from.teamId,
          toTeamId: to.teamId,
          fromTeamLevel: from.teamLevel,
          toTeamLevel: to.teamLevel,
        }
      };
      seedEventsList.push(e);
    });
  }

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
    const isNewCompany = newEvents.some(e => e.type === 'CompanyCreated' && e.aggregateId !== 'company-demo');

    if (isNewCompany) {
        // If a new company is created, only add its creation event.
        db.events.push(...newEvents.filter(e => e.entity === 'company'));
    } else {
        db.events.push(...newEvents);
    }
    
    saveDb(db);
    (async () => {
      await ensureProjectionHandlersLoaded();
      newEvents.forEach(e => dispatchProjectionHandlers(e));
      resolve();
    })();
  });
};

/**
 * Retrieves all events for a specific aggregate ID (e.g., a team ID).
 * @param aggregateId - The ID of the aggregate.
 * @returns An array of events.
 */
export const getEventsFor = async (
  aggregateId: string
): Promise<TeamEvent[]> => {
  // Narrow to team-scoped events for the given aggregateId. Many callers
  // expect a TeamEvent[] (radar, strategies, initiative operations), so
  // filter by entity === 'team' to satisfy typing and avoid passing
  // unrelated Company or Linking events into team projections.
  return new Promise((resolve) => {
    const db = getDb();
    const aggregateEvents = db.events.filter((e) => e.aggregateId === aggregateId && e.entity === 'team');
    resolve(aggregateEvents as TeamEvent[]);
  });
};

// Overloads: when requesting team events we return TeamEvent[] which is the
// shape projections and command handlers expect. For other entity types we
// return the generic AllEvents[] union.
export function getEventsByEntityAndId(entity: 'team', aggregateId: string): Promise<TeamEvent[]>;
export function getEventsByEntityAndId(entity: string, aggregateId: string): Promise<AllEvents[]>;
export async function getEventsByEntityAndId(entity: string, aggregateId: string): Promise<any> {
  return new Promise((resolve) => {
    const db = getDb();
    const events = db.events.filter((e) => e.entity === entity && e.aggregateId === aggregateId);
    if (entity === 'team') return resolve(events as TeamEvent[]);
    resolve(events);
  });
}

/**
 * Retrieves all events in the store.
 * NOTE: This is for projection rebuilding.
 */
export const _getAllEvents = async (): Promise<AllEvents[]> => {
  return new Promise((resolve) => resolve(getDb().events));
};

// Initialize the global mock DB
getDb();

type ProjectionHandler = (event: AllEvents) => void;
const projectionHandlers: Record<string, ProjectionHandler[]> = {};

export const registerProjectionHandler = (eventType: string, handler: ProjectionHandler) => {
  if (!projectionHandlers[eventType]) projectionHandlers[eventType] = [];
  projectionHandlers[eventType].push(handler);
};

const dispatchProjectionHandlers = (event: AllEvents) => {
  const handlers = projectionHandlers[event.type] || [];
  handlers.forEach(h => h(event));
};

export const runProjectionOn = (event: AllEvents) => dispatchProjectionHandlers(event);

export const resetEventStore = () => {
  (global as any)._mockDbEvents = undefined;
};

export const seedDemoCompany = async () => {
  try {
    // Ensure projection handlers are loaded
    await ensureProjectionHandlersLoaded();
    
    console.log('Seeding demo company...');
    // Force re-seed by resetting and calling getDb
    resetEventStore();
    const db = getDb();
    
    console.log('Current events before seeding:', db.events.length);

    // Create some sample initiatives for each team
    const teamIds = [...new Set(initialTeams.map(team => team.id))];
    const initiatives = [
      { id: 'init-1', name: 'Improve Team Collaboration', teamId: 'team-bod' },
      { id: 'init-2', name: 'Enhance Product Features', teamId: 'team-ceo' },
      { id: 'init-3', name: 'Optimize Development Workflow', teamId: 'team-cto' },
      { id: 'init-4', name: 'Streamline Financial Processes', teamId: 'team-cfo' },
      { id: 'init-5', name: 'Improve User Experience', teamId: 'team-ceo' },
    ];

    // Create initiative created events. Must match the InitiativeCreatedEvent shape
    // used by the projections (strategyId, initiativeId, tempId, name, template ...).
    const initiativeEvents: InitiativeCreatedEvent[] = initiatives.map(initiative => ({
      type: 'InitiativeCreated',
      entity: 'team', // initiatives are scoped to a team aggregate in our projections
      aggregateId: initiative.teamId,
      timestamp: new Date().toISOString(),
      payload: {
        strategyId: '', // unknown in this simplified seed; empty string is acceptable for demo
        initiativeId: initiative.id,
        tempId: initiative.id,
        name: initiative.name,
        template: {
          id: initiative.id,
          name: initiative.name,
          progression: 0,
          steps: [],
          linkedRadarItemIds: [],
        },
      },
    }));

    // Add the new events to the event store
    await saveEvents(initiativeEvents);
    
    // Re-run projections for all existing events
    const updatedDb = getDb();
    updatedDb.events.forEach(e => {
      console.log('Dispatching event:', e.type, e);
      dispatchProjectionHandlers(e);
    });
    
    console.log('Seeding complete. Total events:', updatedDb.events.length);
    return { 
      ok: true, 
      totalEvents: updatedDb.events.length,
      message: 'Demo data seeded successfully',
      initiatives: initiatives.length
    };
  } catch (error) {
    console.error('Error seeding demo company:', error);
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown error during seeding',
      message: 'Failed to seed demo data' 
    };
  }
};

let _projectionsLoaded = false;
const ensureProjectionHandlersLoaded = async () => {
  if (_projectionsLoaded) return;
  console.log('Loading projection handlers...');
  await Promise.all([
    import('@/lib/domain/initiatives-catalog/projection'),
    import('@/lib/domain/initiatives-linking/projection'),
    import('@/lib/domain/initiatives-catalog/projection'),
  ]);
  _projectionsLoaded = true;
};
