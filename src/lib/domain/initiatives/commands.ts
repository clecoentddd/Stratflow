
// --- Commands ---
import type { Initiative } from '@/lib/types';

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
