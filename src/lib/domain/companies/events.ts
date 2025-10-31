import type { Event } from '../teams/events';

export type CompanyCreatedEvent = Event<
  'CompanyCreated',
  {
    id: string;
    name: string;
  }
>;

export type CompanyEvent = CompanyCreatedEvent;
