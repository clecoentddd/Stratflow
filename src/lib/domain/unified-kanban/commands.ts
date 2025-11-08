import type { MoveElementCommand } from './types';

// Re-export for convenience
export type { MoveElementCommand };

// Generic command for moving elements in kanban
// Updates only the kanban projection, no domain logic

export type UnifiedKanbanCommand = MoveElementCommand;