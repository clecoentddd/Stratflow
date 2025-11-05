import type { Event } from '../teams/events';
import type { RadarItem } from '@/lib/types';

export type RadarItemCreatedEvent = Event<'RadarItemCreated', RadarItem>;