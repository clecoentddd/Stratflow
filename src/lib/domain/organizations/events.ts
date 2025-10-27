// Event Sourcing and CQRS Types
export type Event<T extends string, P> = {
  type: T;
  payload: P;
  timestamp: string;
  aggregateId: string; // The ID of the entity the event belongs to (e.g., Organization ID)
  entity: string; // The type of entity (e.g., 'organization')
};

export type OrganizationCreatedEvent = Event<
  'OrganizationCreated',
  {
    id: string;
    companyId: string;
    name: string;
    purpose: string;
    context: string;
    level: number;
  }
>;

// Union of all events related to an Organization
export type OrganizationEvent = OrganizationCreatedEvent; // Add more events like OrganizationUpdated, etc.
