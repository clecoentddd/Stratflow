/**
 * Event Log Projection Handler
 * 
 * This module implements live projections for the event log using the slice architecture pattern.
 * It provides cache management and query functions for event log data.
 * 
 * Unlike other projections, the event log is a direct view of the event store with sorting/filtering.
 * It maintains a live cache of all events for fast querying.
 */

import { registerProjectionHandler } from '@/lib/db/event-store';
import { _getAllEvents } from '@/lib/db/event-store';
import type { TeamEvent } from '@/lib/domain/teams/events';
import type { CompanyEvent } from '@/lib/domain/companies/events';

// For the event log, we want to capture ALL events, not just specific types
export type AnyEvent = any;

// In-memory event log cache - using globalThis to survive hot reloads
declare global {
  var __eventLogProjectionCache: AnyEvent[] | null | undefined;
  var __eventLogCacheExplicitlyEmptied: boolean | undefined;
}

const getEventLogProjectionCache = () => globalThis.__eventLogProjectionCache ?? null;
const setEventLogProjectionCache = (cache: AnyEvent[] | null) => {
  globalThis.__eventLogProjectionCache = cache;
};
const getEventLogCacheExplicitlyEmptied = () => globalThis.__eventLogCacheExplicitlyEmptied ?? false;
const setEventLogCacheExplicitlyEmptied = (emptied: boolean) => {
  globalThis.__eventLogCacheExplicitlyEmptied = emptied;
};

/**
 * Empties the event log projection cache.
 * NOTE: This doesn't delete events, just empties the view cache.
 */
export const emptyEventLogProjectionCache = (): void => {
  console.log('📋 [EVENT-LOG] Emptying event log projection cache...');
  setEventLogProjectionCache(null);
  setEventLogCacheExplicitlyEmptied(true);
  console.log('🗑️ Event log projection cache emptied and marked as explicitly empty');
};

/**
 * Rebuilds the event log projection cache from the event store.
 */
export const rebuildEventLogProjectionCache = async (): Promise<void> => {
  console.log('🔧 [EVENT-LOG] *** REBUILD FUNCTION CALLED ***');
  console.log('🔧 [EVENT-LOG] Rebuilding event log projection cache from event store...');
  
  const events = await buildEventLogFromEventStore();
  
  console.log('🔧 [EVENT-LOG] Final projection contains', events.length, 'events');
  
  setEventLogProjectionCache(events);
  setEventLogCacheExplicitlyEmptied(false);
  console.log('🔧 [EVENT-LOG] Event log projection cache rebuilt and stored');
};

/**
 * Builds event log projection from event store (internal function).
 */
const buildEventLogFromEventStore = async (): Promise<AnyEvent[]> => {
  console.log('🚨 [EVENT-LOG-BUILD] *** BUILD FUNCTION CALLED ***');
  console.log('Building event log projection from event store...');
  
  const allEvents = await _getAllEvents();
  
  console.log('Total events from store:', allEvents.length);
  
  // Sort events by timestamp (newest first for event log view)
  const sortedEvents = [...allEvents].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ) as AnyEvent[];
  
  console.log('🔍 [EVENT-LOG-BUILD] Final sorted event log contains', sortedEvents.length, 'events');
  return sortedEvents;
};

/**
 * Gets the event log projection (pure read model query).
 * Returns all events sorted by timestamp (newest first).
 */
export const getEventLogProjection = async (): Promise<AnyEvent[]> => {
  console.log('🔍 [EVENT-LOG] Getting live event log projection...');
  
  // Check if cache was explicitly emptied (for debugging/monitoring)
  if (getEventLogCacheExplicitlyEmptied()) {
    console.log('🗑️ Cache was explicitly emptied - returning empty array');
    return [];
  }
  
  // Get the live projection maintained by event handlers
  const liveProjection = getEventLogProjectionCache();
  if (liveProjection) {
    console.log('🎯 Returning live event log projection:', liveProjection.length, 'events');
    const slice = liveProjection.slice(0, 3).map(ev => ({ type: ev.type, timestamp: ev.timestamp, aggregateId: ev.aggregateId }));
    console.log('🎯 [EVENT-LOG] Live projection head (max 3):', slice);
    return liveProjection;
  }
  
  // Cold start - need to bootstrap from event store (only happens on first access)
  console.log('🔨 Cold start: Building initial projection from event store');
  const initialCache = await buildEventLogFromEventStore();
  setEventLogProjectionCache(initialCache);
  setEventLogCacheExplicitlyEmptied(false);
  
  console.log('🎯 Initial projection built with', initialCache.length, 'events');
    const initialSlice = initialCache.slice(0, 3).map(ev => ({ type: ev.type, timestamp: ev.timestamp, aggregateId: ev.aggregateId }));
    console.log('🎯 [EVENT-LOG] Initial projection head (max 3):', initialSlice);
  return initialCache;
};

// Handler for ANY event - updates live event log projection
function onAnyEvent(event: any) {
  console.log('🔄 [LIVE-PROJECTION] *** Event Log: New event received! ***');
  console.log('🔄 [LIVE-PROJECTION] Event type:', event.type, 'Entity:', event.entity, 'Timestamp:', event.timestamp);
  
  try {
    // Get current cache or initialize empty
    let currentCache = getEventLogProjectionCache() || [];
    console.log('🔄 [LIVE-PROJECTION] Current cache has', currentCache.length, 'events');
    
    // Add the new event at the beginning (newest first)
    const updatedCache = [event, ...currentCache];
    console.log('🔄 [LIVE-PROJECTION] Appending event to cache. New length will be', updatedCache.length);
    console.log('🔄 [LIVE-PROJECTION] Event payload preview:', JSON.stringify(event.payload, null, 2));
    if (currentCache[0]) {
      console.log('🔄 [LIVE-PROJECTION] Previous head before append:', {
        type: currentCache[0].type,
        timestamp: currentCache[0].timestamp,
        aggregateId: currentCache[0].aggregateId,
      });
    } else {
      console.log('🔄 [LIVE-PROJECTION] Cache was empty before append');
    }
    
    // Update the live projection
    setEventLogProjectionCache(updatedCache);
    setEventLogCacheExplicitlyEmptied(false);
    
    const head = updatedCache[0];
    console.log('🔄 [LIVE-PROJECTION] Event added to live projection. Cache now has', updatedCache.length, 'events');
    console.log('🔄 [LIVE-PROJECTION] New head of cache:', {
      type: head?.type,
      timestamp: head?.timestamp,
      aggregateId: head?.aggregateId,
    });
    const topThree = updatedCache.slice(0, 3).map(ev => ({ type: ev.type, timestamp: ev.timestamp, aggregateId: ev.aggregateId }));
    console.log('🔄 [LIVE-PROJECTION] Current top three events:', topThree);
    
  } catch (error) {
    console.error('❌ [LIVE-PROJECTION] Error updating event log projection:', error);
  }
}

registerProjectionHandler('UserAdded', onAnyEvent);
// Register handlers for all event types
registerProjectionHandler('CompanyCreated', onAnyEvent);
registerProjectionHandler('TeamCreated', onAnyEvent);
registerProjectionHandler('TeamUpdated', onAnyEvent);
registerProjectionHandler('StrategyCreated', onAnyEvent);
registerProjectionHandler('StrategyUpdated', onAnyEvent);
registerProjectionHandler('InitiativeCreated', onAnyEvent);
registerProjectionHandler('InitiativeUpdated', onAnyEvent);
registerProjectionHandler('InitiativeProgressUpdated', onAnyEvent);
registerProjectionHandler('InitiativeDeleted', onAnyEvent);
registerProjectionHandler('InitiativeItemAdded', onAnyEvent);
registerProjectionHandler('InitiativeItemUpdated', onAnyEvent);
registerProjectionHandler('InitiativeItemDeleted', onAnyEvent);

// Kanban events
registerProjectionHandler('ElementMoved', onAnyEvent);
registerProjectionHandler('InitiativeAddedToKanban', onAnyEvent);
registerProjectionHandler('InitiativeItemAddedToKanban', onAnyEvent);
registerProjectionHandler('InitiativeRadarItemsLinked', onAnyEvent);

// Tag-an-initiative-with-a-risk events
registerProjectionHandler('TagAdded', onAnyEvent);
registerProjectionHandler('TagRemoved', onAnyEvent);

console.log('✅ Event log projection handlers registered for live updates');