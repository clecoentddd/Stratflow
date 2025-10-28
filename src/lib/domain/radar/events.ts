
import type { Event } from '../teams/events';
import type { RadarItem } from '@/lib/types';

export type RadarItemCreatedEvent = Event<'RadarItemCreated', RadarItem>;

export type RadarItemUpdatedEvent = Event<'RadarItemUpdated', RadarItem>;

export type RadarItemDeletedEvent = Event<'RadarItemDeleted', { id: string }>;

export type RadarEvent =
  | RadarItemCreatedEvent
  | RadarItemUpdatedEvent
  | RadarItemDeletedEvent;
