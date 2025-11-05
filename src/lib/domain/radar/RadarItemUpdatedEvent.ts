import type { Event } from '../teams/events';
import type { RadarItem } from '@/lib/types';

export type RadarItemUpdatedEvent = Event<'RadarItemUpdated', RadarItem>;