import type { Event } from '../teams/events';

export type RadarItemDeletedEvent = Event<'RadarItemDeleted', { id: string }>;