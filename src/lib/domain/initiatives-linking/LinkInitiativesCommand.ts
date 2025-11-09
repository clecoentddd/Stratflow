// LinkInitiativesCommand.ts
export type LinkInitiativesCommand = {
  fromInitiativeId: string;
  toInitiativeIds: string[];
  requestedBy?: string;
};
