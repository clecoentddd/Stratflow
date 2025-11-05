// --- Commands ---

export type CreateInitiativeCommand = {
  strategyId: string;
  name: string;
};

export type UpdateInitiativeCommand = {
    initiativeId: string;
    name?: string;
    progression?: number;
    linkedRadarItemIds?: string[];
};

export type DeleteInitiativeCommand = {
    initiativeId: string;
    strategyId: string;
};
