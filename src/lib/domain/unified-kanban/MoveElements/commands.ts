import type { MoveElementCommand } from '../types';
export type { MoveElementCommand };

// Re-export for convenience
// Removed re-export of MoveElementCommand

// Generic command for moving elements in kanban
// Updates only the kanban projection, no domain logic

export type UnifiedKanbanCommand = MoveElementCommand; // Only export UnifiedKanbanCommand