
// --- Commands ---
import type { Strategy } from '@/lib/types';

export type CreateStrategyCommand = {
  description: string;
  timeframe: string;
};

export type UpdateStrategyCommand = Partial<Strategy> & {
    strategyId: string;
};
