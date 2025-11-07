// KanbanBoardItem type for projection slice
export type KanbanStatus = 'ToDo' | 'Doing' | 'Done';

export type KanbanBoardItem = {
  itemId: string;
  initiativeId: string;
  teamId: string;
  name: string;
  text: string;
  status: KanbanStatus;
};
