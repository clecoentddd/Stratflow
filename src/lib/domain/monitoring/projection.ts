import { _getAllEvents } from '@/lib/db/event-store';
import type { TeamEvent } from '@/lib/domain/teams/events';
import type { CompanyEvent } from '@/lib/domain/companies/events';

export type AnyEvent = TeamEvent | CompanyEvent;

export async function getEventLogProjection(): Promise<AnyEvent[]> {
  const allEvents = await _getAllEvents();
  return [...allEvents].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ) as AnyEvent[];
}
