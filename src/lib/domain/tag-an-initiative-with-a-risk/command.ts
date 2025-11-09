// Command for tagging an initiative with a radar item

export interface TagInitiativeWithRiskCommand {
  initiativeId: string;
  radarItemId: string;
}

export interface RemoveTagFromInitiativeCommand {
  initiativeId: string;
  radarItemId: string;
}
