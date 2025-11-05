/**
 * Companies Projection Handler
 * 
 * This module implements live projections for companies using the slice architecture pattern.
 * It provides cache management, event handlers, and query functions for company data.
 * 
 * Following the same pattern as teams projection with:
 * - GlobalThis-based cache for persistence across serverless invocations
 * - Live invalidation on CompanyCreated events
 * - Query-time rebuilding from events when cache is empty
 */

import { registerProjectionHandler } from '@/lib/db/event-store';
import { _getAllEvents } from '@/lib/db/event-store';
import type { CompanyEvent } from '@/lib/domain/companies/events';
import type { Company } from '@/lib/types';

// In-memory projection cache - using globalThis to survive hot reloads
declare global {
  var __companiesProjectionCache: Record<string, Company> | null | undefined;
  var __companiesCacheExplicitlyEmptied: boolean | undefined;
}

const getCompaniesProjectionCache = () => globalThis.__companiesProjectionCache ?? null;
const setCompaniesProjectionCache = (cache: Record<string, Company> | null) => {
  globalThis.__companiesProjectionCache = cache;
};
const getCompanyCacheExplicitlyEmptied = () => globalThis.__companiesCacheExplicitlyEmptied ?? false;
const setCompanyCacheExplicitlyEmptied = (emptied: boolean) => {
  globalThis.__companiesCacheExplicitlyEmptied = emptied;
};

/**
 * Empties the companies projection cache.
 */
export const emptyCompaniesProjectionCache = (): void => {
  console.log('🏢 [COMPANIES] Emptying companies projection cache...');
  setCompaniesProjectionCache(null);
  setCompanyCacheExplicitlyEmptied(true);
  console.log('🗑️ Companies projection cache emptied and marked as explicitly empty');
};

/**
 * Rebuilds the companies projection cache from events.
 */
export const rebuildCompaniesProjectionCache = async (): Promise<void> => {
  console.log('🔧 [COMPANIES] *** REBUILD FUNCTION CALLED ***');
  console.log('🔧 [COMPANIES] Rebuilding companies projection cache from events...');
  
  const newCache = await buildCompaniesProjectionFromEvents();
  
  console.log('🔧 [COMPANIES] Final projection contains', Object.keys(newCache).length, 'companies');
  
  setCompaniesProjectionCache(newCache);
  setCompanyCacheExplicitlyEmptied(false);
  console.log('🔧 [COMPANIES] Companies projection cache rebuilt and stored');
};

/**
 * Builds companies projection from events (internal function).
 */
const buildCompaniesProjectionFromEvents = async (): Promise<Record<string, Company>> => {
  console.log('🚨 [COMPANIES-BUILD] *** BUILD FUNCTION CALLED ***');
  console.log('Building companies projection from events...');
  
  const allEvents = await _getAllEvents();
  const companyEvents = allEvents.filter(e => e.entity === 'company') as CompanyEvent[];
  
  console.log('Total events:', allEvents.length);
  console.log('Company events:', companyEvents.length);
  
  // Group events by company ID
  const eventsByCompanyId: Record<string, CompanyEvent[]> = {};
  companyEvents.forEach(event => {
    if (!eventsByCompanyId[event.aggregateId]) {
      eventsByCompanyId[event.aggregateId] = [];
    }
    eventsByCompanyId[event.aggregateId].push(event);
  });
  
  // Build projection for each company
  const projection: Record<string, Company> = {};
  
  for (const companyId in eventsByCompanyId) {
    const companyEventList = eventsByCompanyId[companyId];
    console.log(`🔍 [COMPANIES-BUILD] Processing ${companyEventList.length} events for company ${companyId}`);
    
    // Sort events by timestamp
    companyEventList.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    console.log(`🔍 [COMPANIES-BUILD] Event types for company ${companyId}:`, companyEventList.map(e => e.type));
    
    // Apply events to build company state
    console.log(`🚨 [COMPANIES-BUILD] About to call applyEventsToCompany for ${companyId} with ${companyEventList.length} events`);
    const company = applyEventsToCompany(null, companyEventList);
    console.log(`🚨 [COMPANIES-BUILD] applyEventsToCompany returned for ${companyId}:`, company ? 'company object' : 'null');
    
    if (company) {
      projection[companyId] = company;
    }
  }
  
  console.log('🔍 [COMPANIES-BUILD] Final projection contains', Object.keys(projection).length, 'companies');
  return projection;
};

/**
 * Applies events to build a company's current state.
 */
const applyEventsToCompany = (
  initialState: Company | null,
  events: CompanyEvent[]
): Company | null => {
  console.log('Applying', events.length, 'events to company projection');
  
  return events.reduce((company, event) => {
    console.log('Processing event:', event.type, 'at', event.timestamp);
    
    switch (event.type) {
      case 'CompanyCreated':
        return {
          id: event.payload.id,
          name: event.payload.name,
          createdAt: event.timestamp, // Add creation timestamp from event
        };
      default:
        return company;
    }
  }, initialState);
};

/**
 * Gets the companies projection (pure read model query).
 * In true event-sourcing/CQRS, this just reads the maintained projection.
 * The projection is kept up-to-date by event handlers, not rebuilt on query.
 */
export const getCompaniesProjection = async (): Promise<Company[]> => {
  console.log('🔍 [COMPANIES] Getting live companies projection...');
  
  // Check if cache was explicitly emptied (for debugging/monitoring)
  if (getCompanyCacheExplicitlyEmptied()) {
    console.log('🗑️ Cache was explicitly emptied - returning empty array');
    return [];
  }
  
  // Get the live projection maintained by event handlers
  const liveProjection = getCompaniesProjectionCache();
  if (liveProjection) {
    console.log('🎯 Returning live companies projection:', Object.keys(liveProjection).length, 'companies');
    return Object.values(liveProjection);
  }
  
  // Cold start - need to bootstrap from events (only happens on first access)
  console.log('🔨 Cold start: Building initial projection from events');
  const initialCache = await buildCompaniesProjectionFromEvents();
  setCompaniesProjectionCache(initialCache);
  setCompanyCacheExplicitlyEmptied(false);
  
  console.log('🎯 Initial projection built with', Object.keys(initialCache).length, 'companies');
  return Object.values(initialCache);
};

/**
 * Gets a specific company by ID.
 */
export const getCompanyByIdProjection = async (id: string): Promise<Company | null> => {
  console.log(`🔍 [COMPANIES] getCompanyByIdProjection(${id})`);
  
  const allCompanies = await getCompaniesProjection();
  return allCompanies.find(company => company.id === id) || null;
};

// Handler for CompanyCreated events - invalidates cache for live updates
function onCompanyCreated(event: any) {
  console.log('🔄 [LIVE-PROJECTION] CompanyCreated event received, directly updating projection:', event.aggregateId);
  
  try {
    // Get current cache or initialize empty
    let currentCache = getCompaniesProjectionCache() || {};
    
    // Directly apply the event to the live projection (no rebuild needed)
    const newCompany = {
      id: event.payload.id,
      name: event.payload.name,
      createdAt: event.timestamp,
    };
    
    currentCache[event.aggregateId] = newCompany;
    
    // Update the live projection
    setCompaniesProjectionCache(currentCache);
    setCompanyCacheExplicitlyEmptied(false);
    
    console.log('🔄 [LIVE-PROJECTION] Company added directly to live projection:', newCompany);
    
  } catch (error) {
    console.error('❌ [LIVE-PROJECTION] Error updating live projection:', error);
  }
}

// Register the handler
registerProjectionHandler('CompanyCreated', onCompanyCreated);

console.log('✅ Companies projection handlers registered for live updates');