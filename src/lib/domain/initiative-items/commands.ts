
// --- Commands ---
import type { InitiativeItem } from '@/lib/types';

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
