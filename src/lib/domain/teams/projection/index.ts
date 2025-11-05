/**
 * Teams Projection Handler
 * 
 * This module implements live projections for teams using the slice architecture pattern.
 * It provides cache management, event handlers, and query functions for teams data.
 * 
 * Following the same pattern as companies projection with:
 * - GlobalThis-based cache for persistence across serverless invocations
 * - Live invalidation on TeamCreated/TeamUpdated events
 * - Query-time rebuilding from events when cache is empty
 */

import { registerProjectionHandler } from '@/lib/db/event-store';
import { _getAllEvents } from '@/lib/db/event-store';
import type { TeamEvent } from '@/lib/domain/teams/events';
import type { Team } from '@/lib/types';

// In-memory projection cache - using globalThis to survive hot reloads
declare global {
  var __teamsProjectionCache: Record<string, Team> | null | undefined;
  var __teamsCacheExplicitlyEmptied: boolean | undefined;
}

const getTeamsProjectionCache = () => globalThis.__teamsProjectionCache ?? null;
const setTeamsProjectionCache = (cache: Record<string, Team> | null) => {
  globalThis.__teamsProjectionCache = cache;
};
const getTeamsCacheExplicitlyEmptied = () => globalThis.__teamsCacheExplicitlyEmptied ?? false;
const setTeamsCacheExplicitlyEmptied = (emptied: boolean) => {
  globalThis.__teamsCacheExplicitlyEmptied = emptied;
};

/**
 * Empties the teams projection cache.
 */
export const emptyTeamsProjectionCache = (): void => {
  console.log('👥 [TEAMS] Emptying teams projection cache...');
  setTeamsProjectionCache(null);
  setTeamsCacheExplicitlyEmptied(true);
  console.log('🗑️ Teams projection cache emptied and marked as explicitly empty');
};

/**
 * Rebuilds the teams projection cache from events.
 */
export const rebuildTeamsProjectionCache = async (): Promise<void> => {
  console.log('🔧 [TEAMS] *** REBUILD FUNCTION CALLED ***');
  console.log('🔧 [TEAMS] Rebuilding teams projection cache from events...');
  
  const newCache = await buildTeamsProjectionFromEvents();
  
  console.log('🔧 [TEAMS] Final projection contains', Object.keys(newCache).length, 'teams');
  
  setTeamsProjectionCache(newCache);
  setTeamsCacheExplicitlyEmptied(false);
  console.log('🔧 [TEAMS] Teams projection cache rebuilt and stored');
};

/**
 * Builds teams projection from events (internal function).
 */
const buildTeamsProjectionFromEvents = async (): Promise<Record<string, Team>> => {
  console.log('🚨 [TEAMS-BUILD] *** BUILD FUNCTION CALLED ***');
  console.log('Building teams projection from events...');
  
  const allEvents = await _getAllEvents();
  const teamEvents = allEvents.filter(e => e.entity === 'team') as TeamEvent[];
  
  console.log('Total events:', allEvents.length);
  console.log('Team events:', teamEvents.length);
  
  // Group events by team ID
  const eventsByTeamId: Record<string, TeamEvent[]> = {};
  teamEvents.forEach(event => {
    if (!eventsByTeamId[event.aggregateId]) {
      eventsByTeamId[event.aggregateId] = [];
    }
    eventsByTeamId[event.aggregateId].push(event);
  });
  
  // Build projection for each team
  const projection: Record<string, Team> = {};
  
  for (const teamId in eventsByTeamId) {
    const teamEventList = eventsByTeamId[teamId];
    console.log(`🔍 [TEAMS-BUILD] Processing ${teamEventList.length} events for team ${teamId}`);
    
    // Sort events by timestamp
    teamEventList.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    console.log(`🔍 [TEAMS-BUILD] Event types for team ${teamId}:`, teamEventList.map(e => e.type));
    
    // Apply events to build team state
    console.log(`🚨 [TEAMS-BUILD] About to call applyEventsToTeam for ${teamId} with ${teamEventList.length} events`);
    const team = applyEventsToTeam(null, teamEventList);
    console.log(`🚨 [TEAMS-BUILD] applyEventsToTeam returned for ${teamId}:`, team ? 'team object' : 'null');
    
    if (team) {
      projection[teamId] = team;
    }
  }
  
  console.log('🔍 [TEAMS-BUILD] Final projection contains', Object.keys(projection).length, 'teams');
  return projection;
};

/**
 * Applies events to build a team's current state.
 */
const applyEventsToTeam = (
  initialState: Team | null,
  events: TeamEvent[]
): Team | null => {
  console.log('Applying', events.length, 'events to team projection');
  
  return events.reduce((team, event) => {
    console.log('Processing event:', event.type, 'at', event.timestamp);
    
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
          name: event.payload.name ?? team.name,
          purpose: event.payload.purpose ?? team.purpose,
          context: event.payload.context ?? team.context,
          // If the update includes a level, apply it
          level: typeof (event.payload as any).level === 'number' ? (event.payload as any).level : team.level,
        };

      // Additional event types would be handled here (RadarItemCreated, StrategyCreated, etc.)
      // For now, keeping it simple with just team lifecycle events
      
      default:
        return team;
    }
  }, initialState);
};

/**
 * Gets the teams projection (pure read model query).
 * In true event-sourcing/CQRS, this just reads the maintained projection.
 * The projection is kept up-to-date by event handlers, not rebuilt on query.
 */
export const getTeamsProjection = async (): Promise<Team[]> => {
  console.log('🔍 [TEAMS] Getting live teams projection...');
  
  // Check if cache was explicitly emptied (for debugging/monitoring)
  if (getTeamsCacheExplicitlyEmptied()) {
    console.log('🗑️ Cache was explicitly emptied - returning empty array');
    return [];
  }
  
  // Get the live projection maintained by event handlers
  const liveProjection = getTeamsProjectionCache();
  if (liveProjection) {
    console.log('🎯 Returning live teams projection:', Object.keys(liveProjection).length, 'teams');
    return Object.values(liveProjection);
  }
  
  // Cold start - need to bootstrap from events (only happens on first access)
  console.log('🔨 Cold start: Building initial projection from events');
  const initialCache = await buildTeamsProjectionFromEvents();
  setTeamsProjectionCache(initialCache);
  setTeamsCacheExplicitlyEmptied(false);
  
  console.log('🎯 Initial projection built with', Object.keys(initialCache).length, 'teams');
  return Object.values(initialCache);
};

/**
 * Gets a specific team by ID.
 */
export const getTeamByIdProjection = async (id: string): Promise<Team | null> => {
  console.log(`🔍 [TEAMS] getTeamByIdProjection(${id})`);
  
  const allTeams = await getTeamsProjection();
  return allTeams.find(team => team.id === id) || null;
};

// Handler for TeamCreated events - updates live projection
function onTeamCreated(event: any) {
  console.log('🔄 [LIVE-PROJECTION] *** TeamCreated event handler called! ***');
  console.log('🔄 [LIVE-PROJECTION] Event details:', JSON.stringify(event, null, 2));
  console.log('🔄 [LIVE-PROJECTION] Directly updating projection for team:', event.aggregateId);
  
  try {
    // Get current cache or initialize empty
    let currentCache = getTeamsProjectionCache() || {};
    console.log('🔄 [LIVE-PROJECTION] Current cache before update:', Object.keys(currentCache));
    
    // Directly apply the event to the live projection (no rebuild needed)
    const newTeam = {
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
    
    currentCache[event.aggregateId] = newTeam;
    
    // Update the live projection
    setTeamsProjectionCache(currentCache);
    setTeamsCacheExplicitlyEmptied(false);
    
    console.log('🔄 [LIVE-PROJECTION] Team added to live projection:', newTeam);
    console.log('🔄 [LIVE-PROJECTION] Cache now has keys:', Object.keys(currentCache));
    
  } catch (error) {
    console.error('❌ [LIVE-PROJECTION] Error updating live projection:', error);
  }
}

// Handler for TeamUpdated events - updates live projection
function onTeamUpdated(event: any) {
  console.log('🔄 [LIVE-PROJECTION] *** TeamUpdated event handler called! ***');
  console.log('🔄 [LIVE-PROJECTION] Updating projection for team:', event.aggregateId);
  
  try {
    // Get current cache or initialize empty
    let currentCache = getTeamsProjectionCache() || {};
    const existingTeam = currentCache[event.aggregateId];
    
    if (existingTeam) {
      // Update the existing team
      const updatedTeam = {
        ...existingTeam,
        name: event.payload.name ?? existingTeam.name,
        purpose: event.payload.purpose ?? existingTeam.purpose,
        context: event.payload.context ?? existingTeam.context,
        level: typeof event.payload.level === 'number' ? event.payload.level : existingTeam.level,
      };
      
      currentCache[event.aggregateId] = updatedTeam;
      setTeamsProjectionCache(currentCache);
      
      console.log('🔄 [LIVE-PROJECTION] Team updated in live projection:', updatedTeam);
    } else {
      console.log('🔄 [LIVE-PROJECTION] Team not found in cache for update:', event.aggregateId);
    }
    
  } catch (error) {
    console.error('❌ [LIVE-PROJECTION] Error updating live projection:', error);
  }
}

// Register the handlers
registerProjectionHandler('TeamCreated', onTeamCreated);
registerProjectionHandler('TeamUpdated', onTeamUpdated);

console.log('✅ Teams projection handlers registered for live updates');