// Unified Kanban Board Types - Lookup Approach
// Statuses managed in kanban projection, domain data looked up at query time

export type KanbanElementType = 'initiative' | 'initiative-item';

export type KanbanColumnDefinition = {
  id: string;
  status: string; // The actual status value (e.g., 'NEW', 'IN_PROGRESS')
  title: string; // Display title
  description?: string;
  color?: string;
};

// Kanban projection entry - stores only status and type
export type KanbanProjectionEntry = {
  type: KanbanElementType;
  status: string;
  boardId?: string; // for filtering different kanban boards
  addedAt: string;
  updatedAt: string;
};

export type KanbanProjection = {
  [elementId: string]: KanbanProjectionEntry;
};

// Enriched element for UI - combines projection data with looked-up domain data
export type EnrichedKanbanElement = {
  id: string; // element ID (e.g., "initiative-123")
  type: KanbanElementType;
  status: string;
  // Looked-up domain data
  title: string;
  description?: string;
  metadata: {
    // Common metadata
    teamId?: string;
    teamName?: string;
    createdAt?: string;
    updatedAt?: string;

    // Initiative-specific
    initiativeId?: string;
    strategyId?: string;

    // Initiative item-specific
    itemId?: string;
    stepKey?: string;
  };
  tags?: string[];
};

export type KanbanBoardData = {
  columns: KanbanColumnDefinition[];
  elements: EnrichedKanbanElement[];
  metadata?: {
    title?: string;
    description?: string;
    lastUpdated?: string;
  };
};

// Move operation - only updates projection
export type MoveElementCommand = {
  elementId: string;
  fromStatus: string;
  toStatus: string;
  boardId?: string;
};