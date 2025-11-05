// Event Log Domain Slice - Public API

// Projections
export { 
  getEventLogProjection, 
  emptyEventLogProjectionCache, 
  rebuildEventLogProjectionCache 
} from './projection';

// Types
export type { AnyEvent } from './projection';