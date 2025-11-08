// Unified Kanban UI State - Manages drag & drop state
import type { EnrichedKanbanElement } from './types';

interface DragState {
  draggedElement: EnrichedKanbanElement | null;
  dragOverColumn: string | null;
  isDragging: boolean;
}

let dragState: DragState = {
  draggedElement: null,
  dragOverColumn: null,
  isDragging: false,
};

export function startDrag(element: EnrichedKanbanElement) {
  dragState = {
    draggedElement: element,
    dragOverColumn: null,
    isDragging: true,
  };
}

export function setDragOverColumn(columnStatus: string | null) {
  dragState.dragOverColumn = columnStatus;
}

export function endDrag() {
  dragState = {
    draggedElement: null,
    dragOverColumn: null,
    isDragging: false,
  };
}

export function clearDragState() {
  dragState = {
    draggedElement: null,
    dragOverColumn: null,
    isDragging: false,
  };
}

export function getDragState(): DragState {
  return { ...dragState };
}

export function getDraggedElement(): EnrichedKanbanElement | null {
  return dragState.draggedElement;
}

export function getDragOverColumn(): string | null {
  return dragState.dragOverColumn;
}

export function isDragging(): boolean {
  return dragState.isDragging;
}