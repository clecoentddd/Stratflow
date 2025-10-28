
// --- Commands ---
import type { Strategy, StrategyState, Initiative, InitiativeItem } from '@/lib/types';

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
  tempId: string; // Add temporary ID for optimistic UI
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

export type AddInitiativeItemCommand = {
    initiativeId: string;
    stepKey: string;
    item: Omit<InitiativeItem, 'id'>; // The text for the new item.
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
