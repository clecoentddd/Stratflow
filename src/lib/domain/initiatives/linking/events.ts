import type { TeamEvent } from '@/lib/domain/teams/events';

// Base event interface used across the app
export type BaseEvent<TType extends string, TEntity extends string, TPayload> = {
  type: TType;
  entity: TEntity;
  aggregateId: string; // team id (we aggregate linking events under the team)
  timestamp: string;
  payload: TPayload;
};

export type InitiativeLinkedEvent = BaseEvent<'InitiativeLinked', 'team', {
  fromInitiativeId: string;
  toInitiativeId: string;
  fromStrategyId: string;
  toStrategyId: string;
  fromTeamId: string;
  toTeamId: string;
  fromTeamLevel: number;
  toTeamLevel: number;
  createdBy?: string;
}>;

export type InitiativeUnlinkedEvent = BaseEvent<'InitiativeUnlinked', 'team', {
  fromInitiativeId: string;
  toInitiativeId: string;
}>;

export type InitiativeDeletedEvent = BaseEvent<'InitiativeDeleted', 'team', {
  initiativeId: string;
}>;

export type LinkingEvents = InitiativeLinkedEvent | InitiativeUnlinkedEvent | InitiativeDeletedEvent;
