// User event types for event store
import type { Event as AddUserEvent } from './add-user/Event';
import type { Event as AssignUserToOrganizationEvent } from './assign-user-to-organization/Event';

export type UserEvent =
  | (AddUserEvent & { aggregateId: string; entity: 'user'; timestamp: string })
  | (AssignUserToOrganizationEvent & { aggregateId: string; entity: 'user'; timestamp: string });

