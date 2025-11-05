// Monitoring Domain Slice - Public API
// 
// Monitoring is a pure consumer of projections from other domains.
// It provides UI to view projections but does not contain projection logic itself.

// Types (re-exported for convenience)
export type { AnyEvent } from '@/lib/domain/event-log';