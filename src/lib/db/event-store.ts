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
import type { ItemKanbanStatusMappedEvent } from '@/lib/domain/initiative-kanban-status-mapped-event/events';
import type { UnifiedKanbanEvent } from '@/lib/domain/unified-kanban/events';

// In a real app, this would be a proper database. We're using a file-based mock store
// for simplicity and to ensure state persists across serverless function invocations.

type AllEvents = TeamEvent | CompanyEvent | LinkingEvents | ItemKanbanStatusMappedEvent | UnifiedKanbanEvent;

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
    import('@/lib/domain/initiatives-catalog/projection'),
    import('@/lib/domain/companies/projection'), // Add companies projection handler for live updates
    import('@/lib/domain/initiative-kanban-status-mapped-projection/kanbanProjection'), // Add kanban projection handler
    import('@/lib/domain/unified-kanban/domainListeners'), // Add unified kanban domain listeners
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
    console.log(`Initialized event store with ${initialEvents.length} events from JSON`);
  } catch (error) {
    console.error('Failed to load initial events:', error);
    // Fallback to empty array if JSON loading fails
    initialEvents = [];
  }

  // Cache the events for write operations only
  (global as any)._mockDbEvents = initialEvents;
  
  // Dispatch initial events to projection handlers
  (async () => {
    await ensureProjectionHandlersLoaded();
    initialEvents.forEach(event => dispatchProjectionHandlers(event));
  })();
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
    
    // Append new events
    const updatedEvents = [...currentEvents, ...newEvents];
    
    // Save back to storage
    (global as any)._mockDbEvents = updatedEvents;
    console.log(`Saved ${newEvents.length} new events. Total events: ${updatedEvents.length}`);
    
    // Dispatch events to live projection handlers
    (async () => {
      newEvents.forEach(event => dispatchProjectionHandlers(event));
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
