import type { Event } from '../organizations/events';

export type CompanyCreatedEvent = Event<
  'CompanyCreated',
  {
    id: string;
    name: string;
  }
>;

export type CompanyEvent = CompanyCreatedEvent;
