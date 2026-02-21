import type { CompanyEvent } from '@/lib/domain/companies/events';
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
import type { TagAddedEvent, TagRemovedEvent } from '../domain/tag-an-initiative-with-a-risk/events';
import type { UnifiedKanbanEvent } from '@/lib/domain/unified-kanban/events';
import type { UserEvent } from '@/lib/domain/userManagement/UserEvent';

import type { StrategyEvent } from '@/lib/domain/strategies/events';
import type { InitiativeEvent } from '@/lib/domain/initiatives/events';
import type { RadarEvent } from '@/lib/domain/radar/events';

// In a real app, this would be a proper database. We're using a file-based mock store
// for simplicity and to ensure state persists across serverless function invocations.

export type AllEvents =
  | TeamEvent
  | CompanyEvent
  | LinkingEvents
  | UnifiedKanbanEvent
  | TagAddedEvent
  | TagRemovedEvent
  | UserEvent
  | StrategyEvent
  | InitiativeEvent
  | RadarEvent;

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

// Projection handler management
type ProjectionHandler = (event: AllEvents, isReplay?: boolean) => void;
const projectionHandlers: Record<string, ProjectionHandler[]> = {};

const backfillTenantIds = (events: AllEvents[]): AllEvents[] => {
  const tenantByCompany = new Map<string, string>();
  const tenantByTeam = new Map<string, string>();
  const tenantByInitiative = new Map<string, string>();
  const tenantByElement = new Map<string, string>();

  const remember = (event: AllEvents) => {
    const anyEvent = event as any;
    if (event.entity === 'company') {
      tenantByCompany.set(event.aggregateId, event.tenantId);
    }
    if (event.entity === 'team') {
      tenantByTeam.set(event.aggregateId, event.tenantId);
    }
    if (event.entity === 'initiative') {
      tenantByInitiative.set(event.aggregateId, event.tenantId);
      tenantByElement.set(event.aggregateId, event.tenantId);
    }

    const metadata = anyEvent.metadata;
    if (metadata?.teamId && typeof metadata.teamId === 'string') {
      tenantByTeam.set(metadata.teamId, event.tenantId);
    }
    if (metadata?.initiativeId && typeof metadata.initiativeId === 'string') {
      tenantByInitiative.set(metadata.initiativeId, event.tenantId);
      tenantByElement.set(`initiative-${metadata.initiativeId}`, event.tenantId);
    }

    const payload = anyEvent.payload;
    if (payload?.initiativeId && typeof payload.initiativeId === 'string') {
      tenantByInitiative.set(payload.initiativeId, event.tenantId);
      tenantByElement.set(`initiative-${payload.initiativeId}`, event.tenantId);
    }
    if (payload?.itemId && typeof payload.itemId === 'string') {
      tenantByElement.set(payload.itemId, event.tenantId);
      tenantByElement.set(`initiative-item-${payload.itemId}`, event.tenantId);
    }
    if (payload?.boardId && typeof payload.boardId === 'string') {
      tenantByTeam.set(payload.boardId, event.tenantId);
    }
    if (payload?.teamId && typeof payload.teamId === 'string') {
      tenantByTeam.set(payload.teamId, event.tenantId);
    }
    if (event.type === 'ElementMoved' && payload?.elementId) {
      tenantByElement.set(payload.elementId, event.tenantId);
      tenantByElement.set(event.aggregateId, event.tenantId);
    }
    if ((event.type === 'TagAdded' || event.type === 'TagRemoved') && typeof event.aggregateId === 'string') {
      tenantByInitiative.set(event.aggregateId, event.tenantId);
    }
    if (event.type === 'InitiativeLinked' && payload) {
      if (payload.fromInitiativeId) tenantByInitiative.set(payload.fromInitiativeId, event.tenantId);
      if (payload.toInitiativeId) tenantByInitiative.set(payload.toInitiativeId, event.tenantId);
    }
  };

  const resolveTenant = (event: AllEvents): string => {
    const anyEvent = event as any;

    if (anyEvent.tenantId && typeof anyEvent.tenantId === 'string' && anyEvent.tenantId.length > 0) {
      return anyEvent.tenantId;
    }

    const candidates: Array<string | undefined> = [];

    if (event.entity === 'company') {
      candidates.push(event.aggregateId);
      candidates.push(anyEvent.payload?.id);
    }

    if (event.entity === 'user') {
      candidates.push(anyEvent.payload?.companyId);
    }

    if (event.entity === 'team') {
      if (event.type === 'TeamCreated') {
        candidates.push((event as TeamCreatedEvent).payload.companyId);
      }
      candidates.push(tenantByTeam.get(event.aggregateId));
    }

    candidates.push(tenantByCompany.get(event.aggregateId));
    candidates.push(tenantByTeam.get(event.aggregateId));

    const metadata = anyEvent.metadata;
    if (metadata) {
      if (typeof metadata.tenantId === 'string') candidates.push(metadata.tenantId);
      if (metadata.teamId) candidates.push(tenantByTeam.get(metadata.teamId));
      if (metadata.initiativeId) candidates.push(tenantByInitiative.get(metadata.initiativeId));
      if (metadata.boardId) candidates.push(tenantByTeam.get(metadata.boardId));
    }

    const payload = anyEvent.payload;
    if (payload) {
      if (payload.tenantId) candidates.push(payload.tenantId);
      if (payload.initiativeId) candidates.push(tenantByInitiative.get(payload.initiativeId));
      if (payload.fromInitiativeId) candidates.push(tenantByInitiative.get(payload.fromInitiativeId));
      if (payload.toInitiativeId) candidates.push(tenantByInitiative.get(payload.toInitiativeId));
      if (payload.boardId) candidates.push(tenantByTeam.get(payload.boardId));
      if (payload.teamId) candidates.push(tenantByTeam.get(payload.teamId));
      if (payload.companyId) candidates.push(payload.companyId);
      if (payload.itemId) candidates.push(tenantByElement.get(payload.itemId));
    }

    if (event.type === 'ElementMoved') {
      const elementId = payload?.elementId;
      if (elementId) {
        candidates.push(tenantByElement.get(elementId));
        if (elementId.startsWith('initiative-')) {
          const initiativeId = elementId.replace(/^initiative-/, '');
          candidates.push(tenantByInitiative.get(initiativeId));
        }
        if (elementId.startsWith('initiative-item-')) {
          const itemId = elementId.replace(/^initiative-item-/, '');
          candidates.push(tenantByElement.get(itemId));
        }
      }
      candidates.push(tenantByElement.get(event.aggregateId));
      candidates.push(tenantByTeam.get(payload?.boardId));
      candidates.push(tenantByTeam.get(metadata?.teamId));
    }

    if (event.entity === 'initiative') {
      candidates.push(tenantByInitiative.get(event.aggregateId));
    }

    const resolved = candidates.find((value): value is string => typeof value === 'string' && value.length > 0);
    if (resolved) return resolved;

    console.warn('[EVENT-STORE] Unable to backfill tenantId for initial event', event.type, event.aggregateId);
    return 'tenant-missing';
  };

  return events.map(event => {
    const tenantId = resolveTenant(event);
    const withTenant = (event as any).tenantId === tenantId ? event : ({ ...event, tenantId } as AllEvents);
    remember(withTenant);
    return withTenant;
  });
};

export const registerProjectionHandler = (eventType: string, handler: ProjectionHandler) => {
  if (!projectionHandlers[eventType]) projectionHandlers[eventType] = [];
  projectionHandlers[eventType].push(handler);
  const handlerCount = projectionHandlers[eventType].length;
  console.log(`[EVENT-STORE] registerProjectionHandler(${eventType}) count=${handlerCount}`);
};

const dispatchProjectionHandlers = (event: AllEvents, isReplay: boolean = false) => {
  const handlers = projectionHandlers[event.type] || [];
  console.log(`[EVENT-STORE] Dispatching event type ${event.type} to ${handlers.length} handler(s). isReplay=${isReplay}`);
  handlers.forEach((h, index) => {
    const handlerName = h.name || 'anonymous';
    console.log(`[EVENT-STORE] -> Handler[${index}] ${handlerName}`);
    h(event, isReplay);
  });
};

export const runProjectionOn = (event: AllEvents) => dispatchProjectionHandlers(event);

// Expose dispatcher for projection replay (for rebuilds)
if (typeof global !== 'undefined') {
  (global as any).dispatchProjectionHandlers = dispatchProjectionHandlers;
}

// Ensure event-log projection handlers are registered after function definitions
import('@/lib/domain/event-log/projection');

let _projectionsLoaded = false;
export const ensureProjectionHandlersLoaded = async () => {
  if (_projectionsLoaded) return;
  console.log('Loading projection handlers...');
  await Promise.all([
    import('@/lib/domain/initiatives-catalog/projection'),
    import('@/lib/domain/initiatives-linking/projection'),
    import('@/lib/domain/companies/projection'), // Add companies projection handler for live updates
    import('@/lib/domain/unified-kanban/domainListeners'), // Add unified kanban domain listeners
    import('@/lib/domain/unified-kanban/projection/kanban-initiatives-projection'),
    import('@/lib/domain/unified-kanban/projection/kanban-initiative-item-projection'),
    import('@/lib/domain/tag-an-initiative-with-a-risk/tagsProjection'), // Ensure tagsProjection is loaded and handlers registered
  ]);
  console.log('All projection handlers loaded');
  _projectionsLoaded = true;
};

// Initialize the event store with JSON data (write-only initialization)
const initializeEventStore = (): void => {
  // Only initialize once
  if ((global as any)._mockDbEvents) {
    return;
  }

  console.log('Initializing event store from JSON (write-only)...');

  // Load initial events from JSON file ONLY on first initialization
  let initialEvents: AllEvents[] = [];
  try {
    // Import the JSON file directly - this works at build time with Next.js
    const eventsData = require('./initial-events.json');
    initialEvents = eventsData as AllEvents[];
    initialEvents = backfillTenantIds(initialEvents);
    console.log(`Initialized event store with ${initialEvents.length} events from JSON`);
  } catch (error) {
    console.error('Failed to load initial events:', error);
    // Fallback to empty array if JSON loading fails
    initialEvents = [];
  }

  // Cache the events for write operations only
  (global as any)._mockDbEvents = initialEvents;

  // Dispatch initial events to projection handlers
  (global as any)._initializationPromise = (async () => {
    await ensureProjectionHandlersLoaded();
    initialEvents.forEach(event => dispatchProjectionHandlers(event, true));
    console.log('Event store initialization complete');
  })();
};

export const waitForEventStore = async () => {
  initializeEventStore();
  if ((global as any)._initializationPromise) {
    await (global as any)._initializationPromise;
  }
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
    // Initialize event store if needed
    initializeEventStore();

    // Get current events array for write operation
    const currentEvents = (global as any)._mockDbEvents || [];
    console.log('[EVENT-STORE] saveEvents called with', newEvents.length, 'event(s)');
    newEvents.forEach((evt, idx) => {
      console.log(`[EVENT-STORE] Event[${idx}] -> type=${evt.type}, aggregateId=${(evt as any).aggregateId}, timestamp=${(evt as any).timestamp}`);
      console.log(`[EVENT-STORE] Event[${idx}] payload snapshot:`, evt.payload);
    });

    newEvents.forEach(event => {
      if (!event.tenantId || typeof event.tenantId !== 'string') {
        throw new Error(`[EVENT-STORE] Missing tenantId for event ${event.type}`);
      }
    });

    // Append new events
    const updatedEvents = [...currentEvents, ...newEvents];

    // Save back to storage
    (global as any)._mockDbEvents = updatedEvents;
    console.log(`Saved ${newEvents.length} new events. Total events: ${updatedEvents.length}`);

    // Dispatch events to live projection handlers
    (async () => {
      newEvents.forEach(event => dispatchProjectionHandlers(event, false));
      const lastThree = updatedEvents.slice(-3).map(e => ({ type: e.type, aggregateId: (e as any).aggregateId, timestamp: (e as any).timestamp }));
      console.log('[EVENT-STORE] Updated event store size:', updatedEvents.length, 'Last three events:', lastThree);
      resolve();
    })();
  });
};

// REMOVED: getEventsFor and getEventsByEntityAndId
// These functions bypass projections and violate CQRS principles.
// All data access should go through domain-specific projections.
// If you need events for rebuilding projections, use _getAllEvents().

/**
 * Retrieves all events in the store.
 * ⚠️  WARNING: This should ONLY be used for projection rebuilding!
 * Normal business logic should use domain projections instead.
 */
export const _getAllEvents = async (): Promise<AllEvents[]> => {
  initializeEventStore();
  const events = (global as any)._mockDbEvents || [];
  return Promise.resolve(events);
};

export const resetEventStore = () => {
  (global as any)._mockDbEvents = undefined;
};

// REMOVED: seedDemoCompany function
// Seeding should be done through proper command handlers that create events,
// which then update projections through event handlers.
// The initial events are loaded from JSON at startup.

// Initialize the event store
initializeEventStore();
