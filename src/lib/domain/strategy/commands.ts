
// --- Commands ---
import type { Strategy, StrategyState } from '@/lib/types';

export type CreateStrategyCommand = {
  description: string;
  timeframe: string;
};

export type UpdateStrategyCommand = Partial<Strategy> & {
    strategyId: string;
};

export type CreateInitiativeCommand = {
  strategyId: string;
  name: string;
};

export type UpdateInitiativeCommand = {
    initiativeId: string;
    progression?: number;
    linkedRadarItemIds?: string[];
};

export type AddInitiativeItemCommand = {
    initiativeId: string;
    stepKey: string;
};

export type UpdateInitiativeItemCommand = {
    initiativeId: string;
    itemId: string;
    text: string;
};

export type DeleteInitiativeItemCommand = {
    initiativeId: string;
    itemId: string;
};
